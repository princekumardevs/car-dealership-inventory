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

### Prompt 3

> go

*(Approval to write the Step 2 failing tests)*

**AI Response:**
- Created `backend/tests/auth.test.ts` with 17 failing tests covering:
  - `POST /api/auth/register` — 7 tests (happy path, 5 validation errors, duplicate email)
  - `POST /api/auth/login` — 5 tests (happy path, missing fields, wrong password, unknown email)
  - JWT Auth Middleware — 5 tests via a test-only `/api/__test__/protected` route (no token, bad scheme, invalid token, expired token, valid token)
- Fixed `jest.config.ts`: removed invalid `runInBand` key and migrated to the modern `transform` syntax.
- Ran `npm test` and confirmed tests **failed red** (`Cannot find module '../src/middleware/auth'`).
- Stopped and showed the test list for review.

---

### Prompt 4

> go

*(Approval to implement Step 2)*

**AI Response:**
- Implemented `backend/src/middleware/auth.ts` — verifies Bearer JWT, loads user from DB, attaches to `req.user`; exports `requireRole()` factory.
- Implemented `backend/src/controllers/auth.controller.ts` — register (validate → bcrypt hash → create → strip passwordHash → sign JWT) and login (find → bcrypt compare → strip passwordHash → sign JWT).
- Implemented `backend/src/routes/auth.routes.ts` and wired into `app.ts`.
- Debugged three successive TS strict-mode compile errors:
  1. `delete` on non-optional property → cast through `unknown as Record<string, unknown>` → still failed → resolved by removing redundant `toJSON` transform and using `toObject() as unknown as Record<string, unknown>`.
  2. `runInBand` in jest config object (CLI-only flag) → removed.
  3. 404 catch-all registered inside `createApp()` intercepting test-added routes → moved catch-all and error handler to `server.ts`, exported as `notFoundHandler` / `errorHandler`.
- Final `npm test` result: **17/17 passed**.
- Updated README test report and AI usage sections.
- Proposed commit message. Stopped — did not begin Step 3.

---

### Prompt 5

> go

*(Approval to write the Step 3 failing tests)*

**AI Response:**
- Created `backend/tests/vehicle.test.ts` with 23 failing tests:
  - `GET /api/vehicles` — 4 tests (no auth, empty list, populated list, field shape)
  - `POST /api/vehicles` — 8 tests (no auth, wrong role, happy path, missing make/model, invalid category, negative price/quantity)
  - `PUT /api/vehicles/:id` — 6 tests (no auth, wrong role, happy path, not found, malformed ID, negative price)
  - `DELETE /api/vehicles/:id` — 5 tests (no auth, wrong role, happy path + confirm gone via GET, not found, malformed ID)
- Ran `npm test` — 23 vehicle tests failed (all 404), auth suite stayed 17/17.
- Stopped and listed all 23 tests for review.

---

### Prompt 6

> go

*(Approval to implement Step 3)*

**AI Response:**
- Implemented `backend/src/controllers/vehicle.controller.ts` — `getVehicles`, `createVehicle`, `updateVehicle`, `deleteVehicle`. Explicit negative price/quantity guards added before Mongoose validation (runValidators doesn't reliably catch min violations on partial updates).
- Implemented `backend/src/routes/vehicle.routes.ts` — `authMiddleware` at router level; `requireRole("admin")` on POST/PUT/DELETE; GET open to any authenticated user.
- Mounted vehicle routes at `/api/vehicles` in `app.ts`.
- Debugged one TS compile error: `IVehicle extends Document` clashes because `model` is both a vehicle field and a Mongoose Document method. Fixed by removing `extends Document` from `IVehicle` — the correct Mongoose v8 pattern.
- Final `npm test` result: **40/40 passed** (both suites green) on the second run.
- Updated README and PROMPTS.md. Proposed commit message. Stopped — did not begin Step 4.

---

### Prompt 7

> go

*(Approval to write the Step 4 failing tests)*

**AI Response:**
- Appended a new `GET /api/vehicles/search` describe block to `tests/vehicle.test.ts` — 12 tests: no-auth, no-filter (all 5 results), make filter (case-insensitive), model filter (case-insensitive), category filter, minPrice, maxPrice, price range, combined make+category, no-match empty array, invalid minPrice, invalid maxPrice.
- Ran `npm test` — 11 new tests failed (all 404, route not yet mounted); 1 passed for free (401 without token, authMiddleware already in place); auth+CRUD suites stayed 40/40.
- Stopped and listed all 12 tests for review.

---

### Prompt 8

> go

*(Approval to implement Step 4)*

**AI Response:**
- Added `searchVehicles` to `vehicle.controller.ts` — builds a dynamic Mongoose filter: `$regex` (case-insensitive) for make/model, exact string match for category, `$gte`/`$lte` for price range; validates minPrice/maxPrice are numeric before querying.
- Added `GET /search` to `vehicle.routes.ts`, explicitly mounted before `/:id` routes to prevent Express treating "search" as an ID param.
- Cleaned up a duplicate route registration caused by an edit tool error (overwritten with correct file).
- Final `npm test` result: **52/52 passed** on the second run.
- Updated README test report and AI usage sections. Proposed commit message. Stopped — did not begin Step 5.

---

### Prompt 9

> go

*(Approval to write the Step 5 failing tests)*

**AI Response:**
- Created `backend/tests/inventory.test.ts` with 16 tests:
  - `POST /api/vehicles/:id/purchase` — 7 tests: no-auth, malformed ID, not-found, success (user), success (admin), out-of-stock 409, **atomic race condition** (two concurrent purchases on qty=1 → exactly one 200 + one 409).
  - `POST /api/vehicles/:id/restock` — 9 tests: no-auth, wrong role (403), malformed ID, not-found, missing qty body, zero qty, negative qty, success (qty 2→12), restock from zero (0→5).
- Ran `npm test` — 14 inventory tests failed (all 404); 2 passed for free (401 no-token). Auth+vehicle suites stayed 52/52.
- Stopped and listed all 16 tests for review.

---

### Prompt 10

> go

*(Approval to implement Step 5)*

**AI Response:**
- Added `purchaseVehicle` to `vehicle.controller.ts`:
  - Atomic `findOneAndUpdate({ _id: id, quantity: { $gt: 0 } }, { $inc: { quantity: -1 } }, { new: true })`.
  - On null result: one follow-up `Vehicle.exists()` read to distinguish 404 (doesn't exist) from 409 (out of stock). Write is never read-then-write.
- Added `restockVehicle` to `vehicle.controller.ts`:
  - Validates `quantity` is present and a positive integer before calling `findByIdAndUpdate({ $inc: { quantity: amount } }, { new: true })`.
- Imported both and mounted `POST /:id/purchase` (any auth) and `POST /:id/restock` (admin) in `vehicle.routes.ts`.
- Server restarted mid-session between writing imports and mounting routes; resumed cleanly.
- Final `npm test` result: **68/68 passed** on the first run.
- Updated README test report and AI usage sections. Proposed commit message. Stopped — did not begin Step 6 (Frontend).

---

### Prompt 11

> go

*(Approval to build the full frontend — Steps 6, 7, and 8 combined)*

**AI Response:**
- **Scaffold (Step 6):** Ran `npx create-vite@latest ./frontend --template react-ts`, installed `tailwindcss @tailwindcss/vite react-router-dom axios`. Configured `vite.config.ts` with Tailwind plugin and `/api` → `http://localhost:5000` proxy. Updated `index.html` with SEO meta, title, and Outfit font from Google Fonts.
- **Design System:** Built `src/index.css` — Tailwind v4 `@import`, CSS custom properties, glassmorphism `.glass`, gradient text, premium button classes (`.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-success`), `.input-field`, `.vehicle-card` with hover lift, `.badge` variants, modal overlay, toast notification, navbar, and keyframe animations.
- **API Layer:** `src/api/client.ts` (Axios instance, JWT Bearer interceptor, 401 redirect interceptor), `src/api/auth.ts` (register, login), `src/api/vehicles.ts` (getVehicles, searchVehicles, createVehicle, updateVehicle, deleteVehicle, purchaseVehicle, restockVehicle — fully typed).
- **Auth Context:** `src/context/AuthContext.tsx` — JWT + user persisted to localStorage, cross-tab sync via `storage` event, `isAdmin` + `isAuthenticated` derived state.
- **Components:** `ProtectedRoute` + `AdminRoute` (route guards), `Navbar` (sticky glass, logo, user chip with avatar initial + admin badge), `VehicleCard` (emoji category icon, price, stock badge green/amber/red, purchase button with spinner), `VehicleForm` (add/edit modal with all fields).
- **Pages (Steps 7-8):** `LoginPage` + `RegisterPage` (floating orb backgrounds, branded auth card, redirect after auth), `VehiclesPage` (live filter bar with 5 filters, responsive card grid, toast notifications on purchase, unauthenticated prompt), `AdminPage` (stats dashboard: total/in-stock/out-of-stock/inventory-value cards; admin table with edit/delete/restock per row; restock modal).
- **Bug fixed:** Vite ESM runtime error — TypeScript `interface` exports are erased at compile time, causing "does not provide export" at runtime. Fixed with `import type` in all consumer files.
- **Result:** Zero TypeScript errors (`tsc --noEmit`), dev server running at `http://localhost:5173`.

---

### Prompt 12

> help me Set up Nginx as a reverse proxy on port 80/443 with SSL (Certbot). This lets the frontend call https://api.yourdomain.com instead of http://ip:5000.

**AI Response:**
- Created detailed step-by-step documentation for configuring Nginx on Ubuntu EC2.
- Provided server block configuration for proxying port 80/443 to `http://127.0.0.1:5000`.
- Documented Certbot installation and automated SSL certificate generation using `certbot --nginx`.
- Updated deployment documentation artifact (`testing_and_deployment_guide.md`).

---

### Prompt 13

> when i am visting https://car-dealership-inventory-eight.vercel.app/, it redirects to https://car-dealership-inventory-eight.vercel.app/login, and when i refresh the page it shows this attached screenshot (404: NOT_FOUND)

**AI Response:**
- Diagnosed single-page application (SPA) client-side routing refresh issue on Vercel.
- Created `frontend/vercel.json` and root `vercel.json` with rewrite rule `"source": "/(.*)", "destination": "/index.html"`.
- Pushed changes to GitHub repo to trigger automatic deployment fix.

---

