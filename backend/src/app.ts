import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import vehicleRoutes from "./routes/vehicle.routes";

/**
 * Creates and configures the Express application.
 * Exported as a factory so Supertest can import it without binding a port.
 *
 * NOTE: The 404 catch-all and global error handler are intentionally NOT
 * registered here. They are added in server.ts (production) so that tests
 * can mount extra routes on the app after createApp() without being
 * intercepted by the catch-all.
 */
const createApp = (): Application => {
  const app = express();

  // ── Middleware ───────────────────────────────────────────────────────────────
  app.use(cors({
  origin: ['https://car-dealership-inventory-eight.vercel.app', 'http://localhost:5173'],
  credentials: true,
}));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Routes ───────────────────────────────────────────────────────────────────
  app.use("/api/auth", authRoutes);
  app.use("/api/vehicles", vehicleRoutes);

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
  });

  return app;
};

/**
 * 404 handler — call AFTER all routes are mounted.
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ message: "Route not found" });
};

/**
 * Global error handler — call AFTER the 404 handler.
 * Catches errors thrown or forwarded via next(err).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
};

export default createApp;


