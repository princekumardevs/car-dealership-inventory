import dotenv from "dotenv";
dotenv.config(); // Load .env before anything else

import { connectDB } from "./config/db";
import createApp, { notFoundHandler, errorHandler } from "./app";

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  try {
    await connectDB();
    const app = createApp();

    // Cap the app with 404 and error handlers AFTER all routes are mounted
    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

