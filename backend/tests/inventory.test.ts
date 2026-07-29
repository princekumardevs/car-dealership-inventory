import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import createApp from "../src/app";
import User from "../src/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = createApp();

let mongod: MongoMemoryServer;
let userToken: string;
let adminToken: string;

// A vehicle with quantity = 2 for purchase tests
const vehiclePayload = {
  make: "Honda",
  model: "Civic",
  year: 2023,
  category: "sedan",
  price: 22000,
  quantity: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const createUserAndGetToken = async (role: "user" | "admin"): Promise<string> => {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const email = role === "admin" ? "admin@example.com" : "user@example.com";
  const user = await User.create({ name: "Test", email, passwordHash, role });
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ id: user._id.toString() }, secret, { expiresIn: "1h" });
};

/**
 * Seeds a vehicle via the POST /api/vehicles endpoint and returns its ID.
 * Using the HTTP endpoint (not direct DB write) keeps the test realistic.
 */
const seedVehicle = async (overrides = {}): Promise<string> => {
  const res = await request(app)
    .post("/api/vehicles")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ ...vehiclePayload, ...overrides });
  return res.body.vehicle._id as string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite lifecycle
// ─────────────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.JWT_SECRET = "test-jwt-secret-for-inventory-suite";
  process.env.JWT_EXPIRES_IN = "1h";
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  userToken = "";
  adminToken = "";
});

beforeEach(async () => {
  userToken = await createUserAndGetToken("user");
  adminToken = await createUserAndGetToken("admin");
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vehicles/:id/purchase
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/vehicles/:id/purchase", () => {
  it("should return 401 when no token is provided", async () => {
    const id = await seedVehicle();
    const res = await request(app).post(`/api/vehicles/${id}/purchase`);
    expect(res.status).toBe(401);
  });

  it("should return 400 for a malformed vehicle ID", async () => {
    const res = await request(app)
      .post("/api/vehicles/not-a-valid-id/purchase")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 404 for a valid but non-existent vehicle ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/vehicles/${fakeId}/purchase`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 200 and decrement quantity by 1 for an authenticated user", async () => {
    const id = await seedVehicle({ quantity: 2 });
    const res = await request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vehicle");
    expect(res.body.vehicle.quantity).toBe(1);
  });

  it("should also allow an admin to purchase a vehicle", async () => {
    const id = await seedVehicle({ quantity: 3 });
    const res = await request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicle.quantity).toBe(2);
  });

  it("should return 409 when quantity is already 0 (out of stock)", async () => {
    const id = await seedVehicle({ quantity: 0 });
    const res = await request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message");
  });

  it("should be atomic — two concurrent purchases on qty=1 should result in exactly one success and one 409", async () => {
    const id = await seedVehicle({ quantity: 1 });

    // Fire both requests simultaneously
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/vehicles/${id}/purchase`)
        .set("Authorization", `Bearer ${userToken}`),
      request(app)
        .post(`/api/vehicles/${id}/purchase`)
        .set("Authorization", `Bearer ${adminToken}`),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one 200, exactly one 409
    expect(statuses).toEqual([200, 409]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vehicles/:id/restock   (admin only)
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/vehicles/:id/restock", () => {
  it("should return 401 when no token is provided", async () => {
    const id = await seedVehicle();
    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .send({ quantity: 10 });
    expect(res.status).toBe(401);
  });

  it("should return 403 when called by a non-admin user", async () => {
    const id = await seedVehicle();
    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 10 });
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 for a malformed vehicle ID", async () => {
    const res = await request(app)
      .post("/api/vehicles/not-a-valid-id/restock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 10 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 404 for a valid but non-existent vehicle ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/vehicles/${fakeId}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 10 });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if quantity is missing from the request body", async () => {
    const id = await seedVehicle();
    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if quantity is zero", async () => {
    const id = await seedVehicle();
    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 0 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if quantity is negative", async () => {
    const id = await seedVehicle();
    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: -5 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 200 and increment quantity by the given amount for an admin", async () => {
    const id = await seedVehicle({ quantity: 2 });
    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vehicle");
    expect(res.body.vehicle.quantity).toBe(12); // 2 + 10
  });

  it("should be able to restock a vehicle that is completely out of stock", async () => {
    const id = await seedVehicle({ quantity: 0 });
    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.quantity).toBe(5);
  });
});
