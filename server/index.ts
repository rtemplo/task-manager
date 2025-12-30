import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import mongoose from "mongoose";
import taskRoutes from "./routes/tasks.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/task-manager";

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

export default app;
