import express, { Application, Request, Response } from "express";
import cors from "cors";

/**
 * Creates and configures the Express application.
 * Routes are not mounted yet — they are added in subsequent steps.
 * Keeping app and server.ts separate allows Supertest to import
 * the app without binding to a port.
 */
const createApp = (): Application => {
  const app = express();

  // ── Middleware ───────────────────────────────────────────────────────────────
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
  });

  // ── 404 handler (catch-all) ──────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
  });

  return app;
};

export default createApp;
