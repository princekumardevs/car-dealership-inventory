import { Request, Response } from "express";
import mongoose from "mongoose";
import Vehicle from "../models/Vehicle";

/**
 * Returns true only if the string is a syntactically valid MongoDB ObjectId.
 * Used to distinguish "bad format" (400) from "not found" (404).
 */
const isValidId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vehicles
// ─────────────────────────────────────────────────────────────────────────────
export const getVehicles = async (_req: Request, res: Response): Promise<void> => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  res.status(200).json({ vehicles });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vehicles/search?make=&model=&category=&minPrice=&maxPrice=
// ─────────────────────────────────────────────────────────────────────────────
export const searchVehicles = async (req: Request, res: Response): Promise<void> => {
  const { make, model, category, minPrice, maxPrice } = req.query;

  // ── Validate numeric params before touching the DB ────────────────────────
  if (minPrice !== undefined && isNaN(Number(minPrice))) {
    res.status(400).json({ message: "minPrice must be a valid number." });
    return;
  }
  if (maxPrice !== undefined && isNaN(Number(maxPrice))) {
    res.status(400).json({ message: "maxPrice must be a valid number." });
    return;
  }

  // ── Build filter dynamically ──────────────────────────────────────────────
  const filter: Record<string, unknown> = {};

  // Case-insensitive regex so "toyota" matches "Toyota"
  if (make) {
    filter.make = { $regex: new RegExp(String(make), "i") };
  }
  if (model) {
    filter.model = { $regex: new RegExp(String(model), "i") };
  }
  // Exact match — category is an enum, no need for regex
  if (category) {
    filter.category = String(category);
  }
  // Build price range using $gte / $lte only when the param is present
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: { $gte?: number; $lte?: number } = {};
    if (minPrice !== undefined) priceFilter.$gte = Number(minPrice);
    if (maxPrice !== undefined) priceFilter.$lte = Number(maxPrice);
    filter.price = priceFilter;
  }

  const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ vehicles });
};


export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  const { make, model, year, category, price, quantity, description } = req.body;

  // Explicit required-field check — gives a clear 400 before Mongoose touches it
  if (!make || !model || !category) {
    res.status(400).json({ message: "make, model, and category are required." });
    return;
  }

  if (price === undefined || price === null) {
    res.status(400).json({ message: "price is required." });
    return;
  }

  // Numeric range guards (Mongoose min validator is the second line of defence)
  if (typeof price === "number" && price < 0) {
    res.status(400).json({ message: "price cannot be negative." });
    return;
  }

  if (quantity !== undefined && typeof quantity === "number" && quantity < 0) {
    res.status(400).json({ message: "quantity cannot be negative." });
    return;
  }

  try {
    const vehicle = await Vehicle.create({
      make,
      model,
      year,
      category,
      price,
      quantity,
      description,
    });
    res.status(201).json({ vehicle });
  } catch (error) {
    // Covers enum violations (invalid category), type errors, etc.
    if (error instanceof mongoose.Error.ValidationError) {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join("; ");
      res.status(400).json({ message });
      return;
    }
    throw error; // bubble up to global error handler
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/vehicles/:id   (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({ message: "Invalid vehicle ID format." });
    return;
  }

  const { price, quantity } = req.body;

  // Explicit negative-value guards (runValidators on findByIdAndUpdate
  // does not reliably run min validators on partial updates)
  if (price !== undefined && typeof price === "number" && price < 0) {
    res.status(400).json({ message: "price cannot be negative." });
    return;
  }

  if (quantity !== undefined && typeof quantity === "number" && quantity < 0) {
    res.status(400).json({ message: "quantity cannot be negative." });
    return;
  }

  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true } // return updated doc, run schema validators
    );

    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found." });
      return;
    }

    res.status(200).json({ vehicle });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join("; ");
      res.status(400).json({ message });
      return;
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/vehicles/:id   (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({ message: "Invalid vehicle ID format." });
    return;
  }

  const vehicle = await Vehicle.findByIdAndDelete(id);

  if (!vehicle) {
    res.status(404).json({ message: "Vehicle not found." });
    return;
  }

  res.status(200).json({ message: "Vehicle deleted successfully." });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vehicles/:id/purchase   (any authenticated user)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Atomically decrements quantity by 1 using a quantity guard in the query
 * filter, so the check and decrement happen in a single round-trip to MongoDB.
 * This prevents race conditions — no read-then-write pattern.
 *
 * Query:  { _id: id, quantity: { $gt: 0 } }  ← guard: only match if in-stock
 * Update: { $inc: { quantity: -1 } }
 *
 * If null is returned (document not matched), we do ONE follow-up read to
 * distinguish "vehicle doesn't exist" (404) from "vehicle exists but qty = 0"
 * (409 Conflict). The write path itself remains atomic.
 */
export const purchaseVehicle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({ message: "Invalid vehicle ID format." });
    return;
  }

  // Atomic decrement — only succeeds if quantity > 0
  const updated = await Vehicle.findOneAndUpdate(
    { _id: id, quantity: { $gt: 0 } },
    { $inc: { quantity: -1 } },
    { new: true }
  );

  if (updated) {
    res.status(200).json({ vehicle: updated });
    return;
  }

  // Null result: either vehicle doesn't exist, or it's out of stock.
  // One follow-up read to distinguish the two cases.
  const exists = await Vehicle.exists({ _id: id });
  if (!exists) {
    res.status(404).json({ message: "Vehicle not found." });
    return;
  }

  res.status(409).json({ message: "Vehicle is out of stock." });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vehicles/:id/restock   (admin only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Atomically increments quantity by the amount supplied in req.body.quantity.
 * Amount must be a positive integer. Uses $inc to avoid any race condition
 * with concurrent purchases.
 */
export const restockVehicle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({ message: "Invalid vehicle ID format." });
    return;
  }

  const { quantity } = req.body;

  if (quantity === undefined || quantity === null) {
    res.status(400).json({ message: "quantity is required in the request body." });
    return;
  }

  const amount = Number(quantity);
  if (!Number.isInteger(amount) || amount <= 0) {
    res.status(400).json({ message: "quantity must be a positive integer." });
    return;
  }

  // Atomic increment — no read-then-write
  const updated = await Vehicle.findByIdAndUpdate(
    id,
    { $inc: { quantity: amount } },
    { new: true }
  );

  if (!updated) {
    res.status(404).json({ message: "Vehicle not found." });
    return;
  }

  res.status(200).json({ vehicle: updated });
};
