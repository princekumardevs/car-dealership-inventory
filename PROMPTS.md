# PROMPTS.md — AI Tooling Chat History

This file logs every prompt sent to the AI assistant and a short note of what the AI did in response.
Maintained in chronological order and updated after each exchange, as required by the assignment.

**AI Tool:** Claude Sonnet 4.6 (Thinking) via Google Antigravity IDE

---

## Session 1 — 2026-07-28

---

### Prompt 1

> *(Full prompt attached as the opening message of this session — see assignment PDF `AI_Kata_Car_Dealership_Inventory_System_V2.md`)*
>
> Summary: Provided the full assignment specification and a locked set of tech decisions, build order, TDD workflow rules, and documentation requirements. Asked AI to propose only the Step 1 folder structure and `package.json` dependencies before writing any code.

**AI Response:**
- Read the full assignment markdown.
- Proposed the folder structure (`/backend/src/config`, `/models`, `/middleware`, `/routes`, `/controllers`, `/tests`, etc.) and a dependency table for both runtime and devDependencies.
- Noted the choice of `bcryptjs` over native `bcrypt` to avoid Windows native build issues.
- Stopped and waited for approval — did not write any code.

---

### Prompt 2

> go

**AI Response:**
- Scaffolded all Step 1 files in one pass:
  - `backend/package.json` — all runtime + dev deps
  - `backend/tsconfig.json` — strict TypeScript, CommonJS for Jest
  - `backend/jest.config.ts` — ts-jest preset, 30s timeout for mongodb-memory-server
  - `backend/src/config/db.ts` — `connectDB` / `disconnectDB` helpers
  - `backend/src/models/User.ts` — Mongoose schema; strips `passwordHash` from JSON output
  - `backend/src/models/Vehicle.ts` — Mongoose schema; compound index for search; validates price/qty non-negative
  - `backend/src/app.ts` — Express app factory (no `listen`), health check route
  - `backend/src/server.ts` — entry point; loads env, connects DB, starts listening
  - `backend/.env.example` — env variable template
  - `backend/tests/.gitkeep` — directory placeholder
  - `README.md` — full initial scaffold with all required sections
  - `PROMPTS.md` — this file
- Ran `npm install` inside `backend/`.
- Proposed a commit message and stopped. Did not begin Step 2.

---
