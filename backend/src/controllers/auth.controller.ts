import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const SALT_ROUNDS = 12;

/**
 * Signs a JWT for the given user ID.
 */
const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: userId }, secret, { expiresIn } as jwt.SignOptions);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email, and password are required." });
      return;
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ message: "Name must be at least 2 characters." });
      return;
    }

    // Simple but practical email regex
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Please provide a valid email address." });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters." });
      return;
    }

    // ── Duplicate check ─────────────────────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ message: "An account with that email already exists." });
      return;
    }

    // ── Hash password & persist ─────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "user", // default role; admin must be set manually in DB
    });

    const token = signToken(user._id.toString());

    // User.create() returns the full in-memory document — strip passwordHash
    // before sending. select:false only affects find() queries, not create().
    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj.passwordHash;

    res.status(201).json({ token, user: userObj });
  } catch (error) {
    // Mongoose duplicate key (E11000) — race-condition safety net
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: "An account with that email already exists." });
      return;
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  // ── Lookup user ───────────────────────────────────────────────────────────
  // Use +passwordHash to explicitly include the field excluded by toJSON
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash"
  );

  if (!user) {
    // Deliberately vague to avoid user enumeration
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  // ── Verify password ───────────────────────────────────────────────────────
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const token = signToken(user._id.toString());

  // We loaded passwordHash for comparison — strip it before responding
  const userObj = user.toObject() as unknown as Record<string, unknown>;
  delete userObj.passwordHash;

  res.status(200).json({ token, user: userObj });
};
