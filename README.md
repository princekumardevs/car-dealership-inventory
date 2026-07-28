# Car Dealership Inventory System

A full-stack Car Dealership Inventory System built as a TDD kata assignment for Incubyte Consulting.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Local Setup](#local-setup)
   - [Prerequisites](#prerequisites)
   - [Backend](#backend-setup)
   - [Frontend](#frontend-setup)
4. [Environment Variables](#environment-variables)
5. [Running Tests](#running-tests)
6. [Test Report](#test-report)
7. [API Reference](#api-reference)
8. [Screenshots](#screenshots)
9. [My AI Usage](#my-ai-usage)

---

## Project Overview

A RESTful API and React SPA allowing:
- **Users** to browse, search, and purchase vehicles
- **Admins** to manage inventory (add, update, delete vehicles and restock quantities)

Built following strict TDD — every backend feature has a failing test written first before implementation.

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Node.js + Express + TypeScript          |
| Database  | MongoDB + Mongoose                      |
| Auth      | JWT (`jsonwebtoken`) + `bcryptjs`       |
| Testing   | Jest + Supertest + `mongodb-memory-server` |
| Frontend  | React + Tailwind CSS (Vite)             |

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB running locally **or** a MongoDB Atlas connection string

---

### Backend Setup

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment template and fill in your values
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, PORT

# 4. Start the development server
npm run dev
# Server runs at http://localhost:5000
```

---

### Frontend Setup

> ⚠️ Frontend scaffolding is completed in Step 6 of the build order. Instructions will be added here when that step is done.

---

## Environment Variables

All backend environment variables are documented in [`backend/.env.example`](./backend/.env.example).

| Variable        | Description                                    | Example                              |
|-----------------|------------------------------------------------|--------------------------------------|
| `MONGO_URI`     | MongoDB connection string                      | `mongodb://localhost:27017/car-dealership` |
| `JWT_SECRET`    | Secret key used to sign JWTs                   | `a_long_random_string`               |
| `JWT_EXPIRES_IN`| Token expiry duration                          | `7d`                                 |
| `PORT`          | Port the Express server listens on             | `5000`                               |

---

## Running Tests

The test suite uses `mongodb-memory-server` — **no real MongoDB instance needed to run tests**.

```bash
cd backend
npm test
```

Tests run serially (`--runInBand`) to avoid port/database conflicts between suites.

---

## Test Report

> 📋 **This section is updated after each `npm test` run with actual output. No results are fabricated.**

### Step 2 — Auth (2026-07-28)

```
PASS tests/auth.test.ts (10.679 s)

  POST /api/auth/register
    √ should register a new user and return 201 with a JWT token (350 ms)
    √ should return 400 if name is missing (8 ms)
    √ should return 400 if email is missing (8 ms)
    √ should return 400 if password is missing (7 ms)
    √ should return 400 for an invalid email format (8 ms)
    √ should return 400 if password is shorter than 6 characters (7 ms)
    √ should return 409 if email is already registered (281 ms)
  POST /api/auth/login
    √ should return 200 with a JWT token for valid credentials (557 ms)
    √ should return 400 if email is missing (271 ms)
    √ should return 400 if password is missing (270 ms)
    √ should return 401 for a wrong password (519 ms)
    √ should return 401 for an email that does not exist (272 ms)
  JWT Auth Middleware
    √ should return 401 when no Authorization header is provided (276 ms)
    √ should return 401 for a malformed token (not Bearer scheme) (271 ms)
    √ should return 401 for an invalid / tampered token (267 ms)
    √ should return 401 for an expired token (304 ms)
    √ should return 200 and grant access with a valid token (280 ms)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Time:        10.817 s
```

### Step 3 — Vehicle CRUD (2026-07-28)

```
PASS tests/vehicle.test.ts (10.209 s)

  GET /api/vehicles
    √ should return 401 when no token is provided (260 ms)
    √ should return 200 with an empty array when no vehicles exist (173 ms)
    √ should return 200 with a list of all vehicles (211 ms)
    √ should return vehicles with the expected fields (198 ms)
  POST /api/vehicles
    √ should return 401 when no token is provided (158 ms)
    √ should return 403 when called by a non-admin user (153 ms)
    √ should return 201 with the created vehicle when called by an admin (195 ms)
    √ should return 400 if make is missing (180 ms)
    √ should return 400 if model is missing (168 ms)
    √ should return 400 if category is invalid (178 ms)
    √ should return 400 if price is negative (161 ms)
    √ should return 400 if quantity is negative (217 ms)
  PUT /api/vehicles/:id
    √ should return 401 when no token is provided (201 ms)
    √ should return 403 when called by a non-admin user (204 ms)
    √ should return 200 with the updated vehicle when called by an admin (197 ms)
    √ should return 404 for a valid but non-existent vehicle ID (169 ms)
    √ should return 400 for a malformed vehicle ID (172 ms)
    √ should return 400 if the update sets price to a negative value (175 ms)
  DELETE /api/vehicles/:id
    √ should return 401 when no token is provided (183 ms)
    √ should return 403 when called by a non-admin user (174 ms)
    √ should return 200 and delete the vehicle when called by an admin (194 ms)
    √ should return 404 for a valid but non-existent vehicle ID (155 ms)
    √ should return 400 for a malformed vehicle ID (146 ms)

PASS tests/auth.test.ts (5.503 s) — 17 passed (unchanged)

Test Suites: 2 passed, 2 total
Tests:       40 passed, 40 total
Time:        15.835 s
```

---

## API Reference

> ✏️ This section is updated as each endpoint group is implemented.

### Auth

| Method | Endpoint              | Auth Required | Description          |
|--------|-----------------------|---------------|----------------------|
| POST   | `/api/auth/register`  | No            | Register a new user  |
| POST   | `/api/auth/login`     | No            | Login, receive JWT   |

### Vehicles

| Method | Endpoint                    | Auth Required | Role    | Description                 |
|--------|-----------------------------|---------------|---------|-----------------------------|
| GET    | `/api/vehicles`             | Yes           | Any     | List all vehicles           |
| POST   | `/api/vehicles`             | Yes           | Admin   | Add a new vehicle           |
| PUT    | `/api/vehicles/:id`         | Yes           | Admin   | Update a vehicle            |
| DELETE | `/api/vehicles/:id`         | Yes           | Admin   | Delete a vehicle            |
| GET    | `/api/vehicles/search`      | Yes           | Any     | Search/filter vehicles      |
| POST   | `/api/vehicles/:id/purchase`| Yes           | Any     | Purchase (decrement qty)    |
| POST   | `/api/vehicles/:id/restock` | Yes           | Admin   | Restock (increment qty)     |

---

## Screenshots

> 📸 **Screenshots will be added by the developer after the frontend is complete.**

---

## My AI Usage

**AI Tool Used:** Claude Sonnet 4.6 (Thinking) via Google Antigravity IDE

### How AI Was Used Per Feature

#### Step 1 — Project Scaffold (Current)
- Proposed the folder structure and dependency list for review and approval before any code was written.
- After approval, generated all scaffold files: `package.json`, `tsconfig.json`, `jest.config.ts`, `db.ts`, `User.ts`, `Vehicle.ts`, `app.ts`, `server.ts`, `.env.example`, and documentation stubs.
- All generated files were reviewed before being written.

#### Step 2 — Auth endpoints + JWT middleware
- Wrote the complete failing test suite (`tests/auth.test.ts`) first — 17 tests across register, login, and middleware — and stopped for approval.
- After approval: implemented `src/middleware/auth.ts` (JWT verify + `requireRole` factory), `src/controllers/auth.controller.ts` (register + login with bcryptjs hashing), `src/routes/auth.routes.ts`, and wired into `app.ts`.
- Debugged three successive TS strict-mode failures iteratively (non-optional `delete`, direct cast to `Record<string,unknown>`, and 404 catch-all registered before test routes).
- Final result: **17/17 tests green** on the third `npm test` run.

### Workflow Reflection

> ✏️ **This section will be written at the end of the session based on what actually happened — not written in advance.**

---
