import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import mongoose from "mongoose";
import appStateRoutes from "../server/routes/appState.js";
import taskRoutes from "../server/routes/tasks.js";
import userRoutes from "../server/routes/users.js";

dotenv.config();

const app = express();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/task-manager";

// Initialize MongoDB connection
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/app-state", appStateRoutes);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Vercel serverless function handler
export default async (req: Request, res: Response) => {
  await connectToDatabase();
  return app(req, res);
};
