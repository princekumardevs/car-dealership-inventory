import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

const router = Router();

/**
 * @route  POST /api/auth/register
 * @access Public
 * @desc   Register a new user account (role defaults to "user")
 */
router.post("/register", register);

/**
 * @route  POST /api/auth/login
 * @access Public
 * @desc   Authenticate a user and return a signed JWT
 */
router.post("/login", login);

export default router;
