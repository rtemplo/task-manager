import mongoose, { type Document, Schema } from "mongoose";

export interface ITask extends Document {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assigneeId: string;
  tags: string[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  isRecentlyUpdated?: boolean;
}

const taskSchema = new Schema<ITask>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      minlength: 3,
    },
    description: {
      type: String,
      required: true,
      minlength: 5,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assigneeId: {
      type: String,
      required: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: String,
      required: true,
    },
    createdAt: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: String,
      required: true,
    },
    isRecentlyUpdated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false, // We're managing timestamps manually as ISO strings
  }
);

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;
