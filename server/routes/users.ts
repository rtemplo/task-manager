import express, { type Request, type Response } from "express";
import User from "../models/User.js";

const router = express.Router();

// GET all users
router.get("/", async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET single user
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST create new user
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({
      message: "Error creating user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
