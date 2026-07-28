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

*No tests have been run yet — test suite will be populated starting from Step 2.*

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

*Additional entries will be logged here as each subsequent feature is completed.*

### Workflow Reflection

> ✏️ **This section will be written at the end of the session based on what actually happened — not written in advance.**

---
