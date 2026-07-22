// src/app.js
// ─────────────────────────────────────────────────────────────────────────
//  Single source of truth for the Express application.
//
//  Used by BOTH entry points:
//    • backend/server.js  → long-running dev server (listens on PORT)
//    • api/index.js       → Vercel serverless handler (exports `app`)
//
//  All routes are mounted under "/api" so the public API surface is
//  identical in every environment and matches the frontend's
//  VITE_API_BASE_URL = "<origin>/api".
// ─────────────────────────────────────────────────────────────────────────
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "../routes/auth.js";
import bookRoutes from "../routes/books.js";
import userRoutes from "../routes/users.js";

// Middleware
import { errorHandler } from "../middleware/errorMiddleware.js";

/**
 * Build the dynamic Content-Security-Policy host list.
 *
 * Why dynamic? In dev we serve media from http://localhost:5000; in prod,
 * media come from Cloudinary (res.cloudinary.com) and user avatars from
 * Google. We read the known origins from env so CSP never silently blocks
 * a resource.
 */
const mediaHosts = [
  "http://localhost:5000",
  "https://res.cloudinary.com",
  "https://*.googleusercontent.com",
  "https://*.google.com",
].filter(Boolean);

export function createApp() {
  const app = express();

  // ── Security headers ───────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "blob:", ...mediaHosts],
          mediaSrc: ["'self'", "blob:", ...mediaHosts],
          connectSrc: ["'self'", "https://*.googleapis.com", "https://res.cloudinary.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          frameSrc: ["'self'", "https://accounts.google.com"],
          objectSrc: ["'none'"],
        },
      },
    })
  );

  // ── Logging ────────────────────────────────────────────────────────────
  app.use(morgan("dev"));

  // ── CORS: allow the configured frontend origin(s) ──────────────────────
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin/serverless calls (no Origin header) & allow-listed
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false); // reject silently; handler still responds
      },
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );

  // ── Body parsing ───────────────────────────────────────────────────────
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // ── Health check (used by Vercel + uptime monitors) ────────────────────
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  );

  // ── API routes (all under /api) ────────────────────────────────────────
  app.use("/api/auth", authRoutes);
  app.use("/api/books", bookRoutes);
  app.use("/api/users", userRoutes);

  // Legacy root banner (kept friendly for anyone hitting the base origin)
  app.get("/", (_req, res) =>
    res.json({ name: "PMI-AudioBook API", status: "running" })
  );

  // Serve static files for local development (before 404 handler)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  // ── 404 + error handler (last) ─────────────────────────────────────────
  app.use((req, res) => res.status(404).json({ error: "Route not found" }));
  app.use(errorHandler);

  return app;
}
