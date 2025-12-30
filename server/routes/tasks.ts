import express, { type Request, type Response } from "express";
import Task from "../models/Task.js";

const router = express.Router();

// GET all tasks
router.get("/", async (_req: Request, res: Response) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching tasks",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET single task
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const task = await Task.findOne({ id: req.params.id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching task",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST create new task
router.post("/", async (req: Request, res: Response) => {
  try {
    const date = new Date().toISOString();
    const taskData = {
      ...req.body,
      id: req.body.id || `task-${Date.now()}`,
      createdAt: date,
      updatedAt: date,
    };

    const task = new Task(taskData);
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({
      message: "Error creating task",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT update task
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updatedData = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const task = await Task.findOneAndUpdate({ id: req.params.id }, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({
      message: "Error updating task",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PATCH update task status (for drag and drop)
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!["todo", "in-progress", "done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findOneAndUpdate(
      { id: req.params.id },
      { status, updatedAt: new Date().toISOString() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({
      message: "Error updating task status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE task
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const task = await Task.findOneAndDelete({ id: req.params.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully", task });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting task",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
