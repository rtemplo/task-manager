import mongoose, { type Document, Schema } from "mongoose";

export interface ISortOption {
  field: "dueDate" | "priority" | "assignee";
  direction: "ascending" | "descending";
}

export interface IColumnSortConfig {
  todo: ISortOption[];
  "in-progress": ISortOption[];
  done: ISortOption[];
}

export interface IAppState extends Document {
  userId: string;
  tasks: {
    sort: {
      applyToAllColumns: boolean;
      columnConfigs: IColumnSortConfig;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const sortOptionSchema = new Schema(
  {
    field: {
      type: String,
      enum: ["dueDate", "priority", "assignee"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["ascending", "descending"],
      required: true,
    },
  },
  { _id: false }
);

const appStateSchema = new Schema<IAppState>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    tasks: {
      sort: {
        columnConfigs: {
          todo: {
            type: [sortOptionSchema],
            default: [],
          },
          "in-progress": {
            type: [sortOptionSchema],
            default: [],
          },
          done: {
            type: [sortOptionSchema],
            default: [],
          },
        },
      },
    },
  },
  { timestamps: true }
);

const AppState = mongoose.model<IAppState>("AppState", appStateSchema);

export default AppState;
