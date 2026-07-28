import mongoose, { Document, Schema } from "mongoose";

/**
 * Roles supported by the system.
 * - "user"  → can browse and purchase vehicles
 * - "admin" → additionally can add, update, delete vehicles and restock
 */
export type UserRole = "user" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: ["user", "admin"] as UserRole[],
      default: "user",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Never return passwordHash in JSON responses
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
