import express, { type Request, type Response } from "express";
import AppState from "../models/AppState.js";

const router = express.Router();

// GET appState for a user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    let appState = await AppState.findOne({ userId: req.params.userId });

    // If no appState exists, create default one
    if (!appState) {
      appState = new AppState({
        userId: req.params.userId,
        tasks: {
          sort: {
            columnConfigs: {
              todo: [],
              "in-progress": [],
              done: [],
            },
          },
        },
      });
      await appState.save();
    }

    res.json(appState);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching app state",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT update sort configuration
router.put("/:userId/sort-config", async (req: Request, res: Response) => {
  try {
    const { columnConfigs } = req.body;

    const appState = await AppState.findOneAndUpdate(
      { userId: req.params.userId },
      {
        $set: {
          "tasks.sort.columnConfigs": columnConfigs,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json(appState);
  } catch (error) {
    res.status(400).json({
      message: "Error updating sort configuration",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE reset appState for a user
router.delete("/:userId", async (req: Request, res: Response) => {
  try {
    const appState = await AppState.findOneAndDelete({ userId: req.params.userId });

    if (!appState) {
      return res.status(404).json({ message: "App state not found" });
    }

    res.json({ message: "App state reset successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error resetting app state",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
