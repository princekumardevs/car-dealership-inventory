import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import createApp from "../src/app";
import User from "../src/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = createApp();

let mongod: MongoMemoryServer;

// Tokens for the two roles used across all test groups
let userToken: string;   // role: "user"
let adminToken: string;  // role: "admin"

// A valid vehicle payload that satisfies all schema constraints
const validVehicle = {
  make: "Toyota",
  model: "Camry",
  year: 2023,
  category: "sedan",
  price: 25000,
  quantity: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a user directly in the DB (bypassing the register endpoint) so we
 * can control the role precisely, then returns a signed JWT for that user.
 */
const createUserAndGetToken = async (role: "user" | "admin"): Promise<string> => {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const email = role === "admin" ? "admin@example.com" : "user@example.com";
  const user = await User.create({ name: "Test User", email, passwordHash, role });

  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ id: user._id.toString() }, secret, { expiresIn: "1h" });
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite lifecycle
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.JWT_SECRET = "test-jwt-secret-for-vehicle-suite";
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
  // Refresh tokens after each clear (users were wiped)
  userToken = "";
  adminToken = "";
});

// Seed fresh tokens before each test
beforeEach(async () => {
  userToken = await createUserAndGetToken("user");
  adminToken = await createUserAndGetToken("admin");
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vehicles
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/vehicles", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/vehicles");
    expect(res.status).toBe(401);
  });

  it("should return 200 with an empty array when no vehicles exist", async () => {
    const res = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vehicles");
    expect(Array.isArray(res.body.vehicles)).toBe(true);
    expect(res.body.vehicles).toHaveLength(0);
  });

  it("should return 200 with a list of all vehicles", async () => {
    // Seed two vehicles via the admin endpoint
    await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validVehicle);

    await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validVehicle, make: "Honda", model: "Accord" });

    const res = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(2);
  });

  it("should return vehicles with the expected fields", async () => {
    await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validVehicle);

    const res = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const vehicle = res.body.vehicles[0];
    expect(vehicle).toHaveProperty("_id");
    expect(vehicle).toHaveProperty("make", "Toyota");
    expect(vehicle).toHaveProperty("model", "Camry");
    expect(vehicle).toHaveProperty("year", 2023);
    expect(vehicle).toHaveProperty("category", "sedan");
    expect(vehicle).toHaveProperty("price", 25000);
    expect(vehicle).toHaveProperty("quantity", 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vehicles
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/vehicles", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).post("/api/vehicles").send(validVehicle);
    expect(res.status).toBe(401);
  });

  it("should return 403 when called by a non-admin user", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${userToken}`)
      .send(validVehicle);

    expect(res.status).toBe(403);
  });

  it("should return 201 with the created vehicle when called by an admin", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validVehicle);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("vehicle");
    expect(res.body.vehicle).toMatchObject({
      make: "Toyota",
      model: "Camry",
      year: 2023,
      category: "sedan",
      price: 25000,
      quantity: 5,
    });
    expect(res.body.vehicle).toHaveProperty("_id");
  });

  it("should return 400 if make is missing", async () => {
    const { make, ...withoutMake } = validVehicle;
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(withoutMake);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if model is missing", async () => {
    const { model, ...withoutModel } = validVehicle;
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(withoutModel);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if category is invalid", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validVehicle, category: "spaceship" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if price is negative", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validVehicle, price: -100 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if quantity is negative", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validVehicle, quantity: -1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/vehicles/:id
// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/vehicles/:id", () => {
  let vehicleId: string;

  // Seed a vehicle before each test in this group
  beforeEach(async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validVehicle);
    vehicleId = res.body.vehicle._id;
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .send({ price: 27000 });

    expect(res.status).toBe(401);
  });

  it("should return 403 when called by a non-admin user", async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ price: 27000 });

    expect(res.status).toBe(403);
  });

  it("should return 200 with the updated vehicle when called by an admin", async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 27000, model: "Camry XSE" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vehicle");
    expect(res.body.vehicle).toMatchObject({ price: 27000, model: "Camry XSE" });
  });

  it("should return 404 for a valid but non-existent vehicle ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/vehicles/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 27000 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 for a malformed vehicle ID", async () => {
    const res = await request(app)
      .put("/api/vehicles/not-a-valid-id")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 27000 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if the update sets price to a negative value", async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: -500 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/vehicles/:id
// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/vehicles/:id", () => {
  let vehicleId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validVehicle);
    vehicleId = res.body.vehicle._id;
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app).delete(`/api/vehicles/${vehicleId}`);
    expect(res.status).toBe(401);
  });

  it("should return 403 when called by a non-admin user", async () => {
    const res = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 200 and delete the vehicle when called by an admin", async () => {
    const res = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");

    // Confirm it's gone
    const getRes = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${userToken}`);
    expect(getRes.body.vehicles).toHaveLength(0);
  });

  it("should return 404 for a valid but non-existent vehicle ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/vehicles/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 for a malformed vehicle ID", async () => {
    const res = await request(app)
      .delete("/api/vehicles/not-a-valid-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});
