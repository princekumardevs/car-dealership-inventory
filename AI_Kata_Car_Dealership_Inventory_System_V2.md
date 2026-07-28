# TDD Kata: Car Dealership Inventory System

## Objective
Design, build, and test a full-stack Car Dealership Inventory System. Tests API development, database management, frontend implementation, testing, and modern dev workflows including AI tools.

## Core Requirements

### 1. Backend API (RESTful)
- **Technology:** Node.js/TypeScript (Express/NestJS), Python (Django/FastAPI), or Ruby (Rails)
- **Database:** Must connect to a real database (PostgreSQL, MongoDB, SQLite). In-memory DB not sufficient.
- **Auth:** Register/login, JWT token-based auth to secure protected endpoints.

**Endpoints:**
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Vehicles (protected):
  - `POST /api/vehicles` — add vehicle
  - `GET /api/vehicles` — list all available vehicles
  - `GET /api/vehicles/search` — search by make, model, category, price range
  - `PUT /api/vehicles/:id` — update vehicle
  - `DELETE /api/vehicles/:id` — delete vehicle (admin only)
- Inventory (protected):
  - `POST /api/vehicles/:id/purchase` — purchase, decreases quantity
  - `POST /api/vehicles/:id/restock` — restock, increases quantity (admin only)

Each vehicle: unique ID, make, model, category, price, quantity in stock.

### 2. Frontend Application (SPA)
- **Technology:** HTML5, CSS3, Tailwind, React
- **Functionality:**
  - Registration/login forms
  - Dashboard/homepage showing all available vehicles
  - Search and filter vehicles
  - "Purchase" button per vehicle, disabled if quantity is zero
  - Admin-only forms/UI to add, update, delete vehicles
- **Design:** Visually appealing, responsive, good UX — room for creativity.

## Process & Technical Guidelines

### 1. Test-Driven Development (TDD)
Write tests before implementation. Clear Red-Green-Refactor pattern expected in commit history, especially backend logic. Aim for high, meaningful test coverage.

### 2. Clean Coding Practices
Clean, readable, maintainable code. Follow SOLID principles and best practices. Well-documented with meaningful comments and clear naming.

### 3. Git & Version Control
Use Git. Commit frequently with clear, descriptive messages narrating the development journey.

### 4. AI Usage Policy (Important)
AI tools are encouraged/expected, but usage must be transparent.

- **AI Co-authorship:** Every commit using an AI tool (boilerplate, tests, debugging, etc.) must add the AI as a co-author — two empty lines after the commit message, then:
  ```
  git commit -m "feat: Implement user registration endpoint"

  Used an AI assistant  to generate the initial boilerplate for the controller and sevices, then manually added validation logic .

  
  Co-authored-by: AI Tool Name <AI@users.noreply.github.com>
  ```
- **README "My AI Usage" section (required):** which AI tools used, how they were used (concrete examples), and a reflection on how AI impacted the workflow.
- **Interview discussion:** be prepared to discuss AI usage in detail.

## Deliverables
- Public Git repo link (GitHub/GitLab)
- Comprehensive `README.md`:
  - Clear project explanation
  - Detailed local setup/run instructions (backend + frontend)
  - Screenshots of the final app in action
  - Mandatory "My AI Usage" section
  - Test report (test suite results)
- `PROMPTS.md` in repo root — full AI tooling chat history including your prompts
- (Optional, brownie points) Link to a deployed live app (Vercel/Netlify/Heroku/AWS)

## Note
Plagiarism is strictly forbidden. AI assistance is encouraged, but copied code from other repos/developers = immediate rejection. They want your work, augmented by modern tools.