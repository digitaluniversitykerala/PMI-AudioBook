# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with two Node.js projects:
  - frontend: React + Vite app (ESM). Uses Axios with a shared instance that injects JWT from localStorage. Google OAuth via @react-oauth/google. Reads Vite env vars VITE_API_BASE_URL and VITE_GOOGLE_CLIENT_ID.
  - backend: Express API with MongoDB (Mongoose). Auth supports email/password and Google OAuth; issues JWTs signed with JWT_SECRET. Routes mounted at /api/auth.

Prerequisites
- Node.js >= 20.16.0 (enforced in frontend). Use npm.
- Environment variables:
  - frontend/.env.local
    - VITE_API_BASE_URL="http://localhost:5000" (or your backend URL)
    - VITE_GOOGLE_CLIENT_ID="..."
  - backend/.env
    - MONGO_URI="..."
    - JWT_SECRET="..."
    - GOOGLE_CLIENT_ID="..." (must match the frontend client ID)
    - PORT=5000 (optional)

Install dependencies
- Frontend
  - From repo root: cd frontend && npm install
- Backend
  - From repo root: cd backend && npm install

Common commands
- Start backend (Express)
  - Terminal 1:
    - cd backend
    - npm start
- Start frontend (Vite dev server)
  - Terminal 2:
    - cd frontend
    - npm run dev
- Lint (frontend only)
  - cd frontend && npm run lint
- Build (frontend only)
  - cd frontend && npm run build
- Preview built frontend
  - cd frontend && npm run preview
- Tests
  - No test runner is configured in either project at this time (backend "test" is a placeholder). There is no single-test command available.

High-level architecture
- Backend (Node/Express + MongoDB)
  - Entry: backend/server.js
    - Middleware: CORS, JSON body parsing
    - Routes: app.use("/api/auth", authRoutes)
    - Storage: Connects to MongoDB via mongoose using MONGO_URI
  - Auth flow
    - Local auth: backend/controllers/authController.js (signup, login)
      - signup: checks for existing email, hashes password (bcrypt), saves User
      - login: verifies password, issues JWT with { id, email }, expiresIn 1h
    - Google OAuth: backend/routes/auth.js
      - POST /api/auth/google: verifies Google ID token with GOOGLE_CLIENT_ID, upserts user, issues JWT (1h)
  - Data model
    - backend/models/User.js: { name, email (unique), password }

- Frontend (React + Vite)
  - Entry: frontend/src/main.jsx wraps the app with GoogleOAuthProvider using VITE_GOOGLE_CLIENT_ID
  - Routing: frontend/src/App.jsx defines routes for Home (/), Login (/login), Signup (/signup1), Dashboard (/dashboard)
  - API client: frontend/src/api.js creates Axios instance with baseURL=VITE_API_BASE_URL and attaches Authorization: Bearer <token> from localStorage

Cross-cutting integration
- The frontend expects the backend at VITE_API_BASE_URL and sends JWTs via Authorization header. The backend validates and issues JWTs using JWT_SECRET. Google OAuth must use the same client ID on both sides.

Notable files and dirs
- backend/server.js — Express app setup and MongoDB connection
- backend/routes/auth.js — Auth routes (local + Google)
- backend/controllers/authController.js — signup/login handlers
- backend/models/User.js — Mongoose User model
- frontend/src/api.js — Axios instance and auth header injection
- frontend/src/main.jsx — Google OAuth provider bootstrap
- frontend/src/App.jsx — App routes

CI/CD and tooling
- No CI workflows, Docker files, or monorepo tooling detected.
- ESLint is configured only for the frontend (eslint.config.js).