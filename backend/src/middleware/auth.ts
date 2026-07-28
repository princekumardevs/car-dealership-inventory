import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

/**
 * Extends Express Request so downstream handlers can access the
 * authenticated user without casting.
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * JWT authentication middleware.
 *
 * Expects:  Authorization: Bearer <token>
 *
 * On success: attaches the full User document to req.user and calls next().
 * On failure: returns 401 with a JSON error message.
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Header must be present and follow the "Bearer <token>" scheme
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided. Authorization denied." });
      return;
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    // Verify signature and expiry — throws if invalid or expired
    const decoded = jwt.verify(token, secret) as { id: string };

    // Fetch the user from DB to ensure the account still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: "User no longer exists. Authorization denied." });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      // Covers invalid signature, malformed token, and TokenExpiredError
      res.status(401).json({ message: "Invalid or expired token. Authorization denied." });
      return;
    }
    // Unexpected server error
    next(error);
  }
};

/**
 * Role-based authorisation middleware factory.
 * Use after authMiddleware to restrict a route to specific roles.
 *
 * Example:
 *   router.delete("/vehicles/:id", authMiddleware, requireRole("admin"), ...)
 */
export const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden. Insufficient permissions." });
      return;
    }
    next();
  };
