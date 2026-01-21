import express, { type Request, type Response } from "express";
import AppState from "../models/AppState.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

const router = express.Router();

const users = [
  {
    id: "user-1",
    name: "Alice Johnson",
    avatar: "https://i.pravatar.cc/150?img=1",
    color: "#3B82F6",
  },
  {
    id: "user-2",
    name: "Bob Smith",
    avatar: "https://i.pravatar.cc/150?img=2",
    color: "#10B981",
  },
  {
    id: "user-3",
    name: "Carol Williams",
    avatar: "https://i.pravatar.cc/150?img=3",
    color: "#F59E0B",
  },
  {
    id: "user-4",
    name: "David Brown",
    avatar: "https://i.pravatar.cc/150?img=4",
    color: "#EF4444",
  },
  {
    id: "user-5",
    name: "Emma Davis",
    avatar: "https://i.pravatar.cc/150?img=5",
    color: "#8B5CF6",
  },
];

// Helper to generate dates relative to today
function generateTasks() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  return [
    {
      id: "task-1",
      title: "Design new landing page",
      description: "Create wireframes and mockups for the new product landing page",
      status: "in-progress" as const,
      priority: "high" as const,
      assigneeId: "user-1",
      tags: ["design", "ui/ux", "frontend"],
      dueDate: tomorrow.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: "task-2",
      title: "Implement authentication system",
      description: "Set up JWT-based authentication with refresh tokens",
      status: "todo" as const,
      priority: "high" as const,
      assigneeId: "user-2",
      tags: ["backend", "security", "api"],
      dueDate: nextWeek.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: lastWeek.toISOString(),
    },
    {
      id: "task-3",
      title: "Write unit tests for API endpoints",
      description: "Achieve 80% code coverage for all REST API endpoints",
      status: "todo" as const,
      priority: "medium" as const,
      assigneeId: "user-2",
      tags: ["testing", "backend", "quality"],
      dueDate: nextWeek.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: lastWeek.toISOString(),
    },
    {
      id: "task-4",
      title: "Fix mobile responsive issues",
      description: "Address layout problems on iOS and Android devices",
      status: "in-progress" as const,
      priority: "high" as const,
      assigneeId: "user-3",
      tags: ["frontend", "mobile", "bugfix"],
      dueDate: yesterday.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: "task-5",
      title: "Database migration to PostgreSQL",
      description: "Migrate existing MongoDB data to PostgreSQL database",
      status: "todo" as const,
      priority: "medium" as const,
      assigneeId: "user-4",
      tags: ["backend", "database", "migration"],
      dueDate: nextWeek.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: lastWeek.toISOString(),
    },
    {
      id: "task-6",
      title: "Update documentation",
      description: "Update API documentation with new endpoints and examples",
      status: "done" as const,
      priority: "low" as const,
      assigneeId: "user-5",
      tags: ["documentation", "api"],
      dueDate: yesterday.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: "task-7",
      title: "Performance optimization",
      description: "Optimize database queries and reduce API response times",
      status: "in-progress" as const,
      priority: "medium" as const,
      assigneeId: "user-2",
      tags: ["backend", "performance", "optimization"],
      dueDate: nextWeek.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: "task-8",
      title: "Set up CI/CD pipeline",
      description: "Configure automated testing and deployment workflows",
      status: "done" as const,
      priority: "high" as const,
      assigneeId: "user-4",
      tags: ["devops", "automation", "testing"],
      dueDate: yesterday.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: "task-9",
      title: "Create admin dashboard",
      description: "Build analytics dashboard with charts and metrics",
      status: "todo" as const,
      priority: "medium" as const,
      assigneeId: "user-1",
      tags: ["frontend", "dashboard", "analytics"],
      dueDate: nextWeek.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: lastWeek.toISOString(),
    },
    {
      id: "task-10",
      title: "Security audit",
      description: "Conduct comprehensive security review and penetration testing",
      status: "todo" as const,
      priority: "high" as const,
      assigneeId: "user-4",
      tags: ["security", "audit", "testing"],
      dueDate: today.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: lastWeek.toISOString(),
    },
    {
      id: "task-11",
      title: "Implement dark mode",
      description: "Add dark mode theme toggle with user preference persistence",
      status: "done" as const,
      priority: "low" as const,
      assigneeId: "user-3",
      tags: ["frontend", "ui/ux", "feature"],
      dueDate: yesterday.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: "task-12",
      title: "Email notification system",
      description: "Set up automated email notifications for important events",
      status: "in-progress" as const,
      priority: "medium" as const,
      assigneeId: "user-5",
      tags: ["backend", "notifications", "email"],
      dueDate: nextWeek.toISOString(),
      createdAt: lastWeek.toISOString(),
      updatedAt: today.toISOString(),
    },
  ];
}

// POST /api/seed - Reset database with demo data
router.post("/", async (_req: Request, res: Response) => {
  try {
    // Clear existing data
    await Task.deleteMany({});
    await User.deleteMany({});
    await AppState.deleteMany({});

    // Insert users
    await User.insertMany(users);

    // Generate and insert tasks with current dates
    const tasks = generateTasks();
    await Task.insertMany(tasks);

    res.json({
      message: "Database reset successfully",
      usersInserted: users.length,
      tasksInserted: tasks.length,
    });
  } catch (error) {
    console.error("Error resetting database:", error);
    res.status(500).json({ message: "Failed to reset database" });
  }
});

export default router;
