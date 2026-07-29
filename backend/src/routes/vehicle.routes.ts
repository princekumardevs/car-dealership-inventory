import { Router } from "express";
import {
  getVehicles,
  searchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
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
 * @route  GET /api/vehicles/search
 * @access Authenticated (any role)
 * @desc   Search/filter vehicles by make, model, category, and/or price range.
 *         MUST be registered before /:id so Express does not treat "search"
 *         as a vehicle ID parameter.
 */
router.get("/search", searchVehicles);

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

/**
 * @route  POST /api/vehicles/:id/purchase
 * @access Authenticated (any role)
 * @desc   Atomically decrement quantity by 1; returns 409 when out of stock
 */
router.post("/:id/purchase", purchaseVehicle);

/**
 * @route  POST /api/vehicles/:id/restock
 * @access Admin only
 * @desc   Atomically increment quantity by req.body.quantity
 */
router.post("/:id/restock", requireRole("admin"), restockVehicle);

export default router;
