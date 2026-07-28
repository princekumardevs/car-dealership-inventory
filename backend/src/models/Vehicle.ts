import mongoose, { Schema } from "mongoose";

/**
 * Vehicle categories supported by the dealership.
 * Extend this list as needed without breaking existing records.
 */
export type VehicleCategory =
  | "sedan"
  | "suv"
  | "truck"
  | "coupe"
  | "convertible"
  | "minivan"
  | "hatchback"
  | "electric"
  | "hybrid"
  | "other";

/**
 * Plain data interface — does NOT extend Document.
 * The field name "model" would clash with Mongoose Document's .model() method
 * if we extended Document directly. mongoose.model<IVehicle>() provides full
 * Document hydration at runtime without the TypeScript conflict.
 */
export interface IVehicle {
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  price: number;
  quantity: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    make: {
      type: String,
      required: [true, "Make is required"],
      trim: true,
      minlength: [1, "Make cannot be empty"],
      maxlength: [100, "Make must be at most 100 characters"],
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
      minlength: [1, "Model cannot be empty"],
      maxlength: [100, "Model must be at most 100 characters"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1886, "Year must be 1886 or later"], // first automobile
      max: [new Date().getFullYear() + 2, "Year is too far in the future"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "sedan",
        "suv",
        "truck",
        "coupe",
        "convertible",
        "minivan",
        "hatchback",
        "electric",
        "hybrid",
        "other",
      ] as VehicleCategory[],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must be at most 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient search queries
VehicleSchema.index({ make: 1, model: 1, category: 1, price: 1 });

const Vehicle = mongoose.model<IVehicle>("Vehicle", VehicleSchema);

export default Vehicle;
