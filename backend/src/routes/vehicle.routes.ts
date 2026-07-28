import { Router } from "express";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicle.controller";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// All vehicle routes require a valid JWT
router.use(authMiddleware);

/**
 * @route  GET /api/vehicles
 * @access Authenticated (any role)
 * @desc   List all vehicles, newest first
 */
router.get("/", getVehicles);

/**
 * @route  POST /api/vehicles
 * @access Admin only
 * @desc   Add a new vehicle to inventory
 */
router.post("/", requireRole("admin"), createVehicle);

/**
 * @route  PUT /api/vehicles/:id
 * @access Admin only
 * @desc   Update an existing vehicle's details
 */
router.put("/:id", requireRole("admin"), updateVehicle);

/**
 * @route  DELETE /api/vehicles/:id
 * @access Admin only
 * @desc   Remove a vehicle from inventory
 */
router.delete("/:id", requireRole("admin"), deleteVehicle);

export default router;
