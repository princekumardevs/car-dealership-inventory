import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import createApp from "../src/app";
import { authMiddleware } from "../src/middleware/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Test app setup
// We attach a test-only protected route to validate the JWT middleware
// without needing the vehicle routes (which come in Step 3).
// ─────────────────────────────────────────────────────────────────────────────
const app = createApp();
app.get("/api/__test__/protected", authMiddleware, (_req, res) => {
  res.status(200).json({ message: "authenticated" });
});

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.JWT_SECRET = "test-jwt-secret-for-auth-suite";
  process.env.JWT_EXPIRES_IN = "7d";
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Clear collections between each test so tests are fully isolated
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  const validPayload = {
    name: "John Doe",
    email: "john@example.com",
    password: "Password123!",
  };

  it("should register a new user and return 201 with a JWT token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toMatchObject({
      name: "John Doe",
      email: "john@example.com",
      role: "user",
    });
    // passwordHash must NEVER appear in the response
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("should return 400 if name is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "john@example.com", password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", email: "john@example.com" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 for an invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", email: "not-an-email", password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if password is shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", email: "john@example.com", password: "abc" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 409 if email is already registered", async () => {
    // First registration succeeds
    await request(app).post("/api/auth/register").send(validPayload);

    // Second registration with the same email must fail
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Jane Doe", email: "john@example.com", password: "Different1!" });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  // Seed one user before each login test
  beforeEach(async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", email: "john@example.com", password: "Password123!" });
  });

  it("should return 200 with a JWT token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "john@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toMatchObject({
      email: "john@example.com",
      role: "user",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "john@example.com" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 for a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "john@example.com", password: "WrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 for an email that does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Password123!" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JWT Auth Middleware
// Tests run against the test-only GET /api/__test__/protected route
// so we can validate middleware behaviour before vehicle routes exist.
// ─────────────────────────────────────────────────────────────────────────────
describe("JWT Auth Middleware", () => {
  let validToken: string;

  // Seed a user and capture the JWT before each middleware test
  beforeEach(async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", email: "john@example.com", password: "Password123!" });
    validToken = res.body.token;
  });

  it("should return 401 when no Authorization header is provided", async () => {
    const res = await request(app).get("/api/__test__/protected");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 for a malformed token (not Bearer scheme)", async () => {
    const res = await request(app)
      .get("/api/__test__/protected")
      .set("Authorization", "Token some-garbage");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 for an invalid / tampered token", async () => {
    const res = await request(app)
      .get("/api/__test__/protected")
      .set("Authorization", "Bearer invalid.token.value");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 for an expired token", async () => {
    // Sign a token that is already expired
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");
    const expiredToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString() },
      process.env.JWT_SECRET as string,
      { expiresIn: "0s" }
    );

    // Small delay to guarantee the token is past its expiry
    await new Promise((r) => setTimeout(r, 10));

    const res = await request(app)
      .get("/api/__test__/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 200 and grant access with a valid token", async () => {
    const res = await request(app)
      .get("/api/__test__/protected")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "authenticated" });
  });
});
