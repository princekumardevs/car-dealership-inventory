import mongoose from "mongoose";

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Exported as a function so it can be called on server startup
 * and also overridden in tests with mongodb-memory-server.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable is not defined");
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

/**
 * Disconnects from MongoDB. Used in test teardown.
 */
export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
