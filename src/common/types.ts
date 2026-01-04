export type TaskStatus = "todo" | "in-progress" | "done";

export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  tags: string[];
  dueDate: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  isRecentlyUpdated?: boolean;
}

export interface TaskFilters {
  searchQuery: string;
  assigneeIds: string[];
  priorities: TaskPriority[];
  tags: string[];
  dueDateFilter: DueDateFilter | null;
}

export type DueDateFilter = "overdue" | "today" | "this-week" | "future";

export interface TaskFormData {
  id?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string;
  tags: string[];
  dueDate: string;
  status: TaskStatus;
}

export type ModalMode = "add" | "edit" | "sort";

export type SimulatedAction =
  | { type: "ADD_TASK"; task: Task }
  | { type: "UPDATE_TASK"; taskId: string; updates: Partial<Task> }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "MOVE_TASK"; taskId: string; newStatus: TaskStatus };

export type SortField = "dueDate" | "priority" | "assignee";

export type SortDirection = "ascending" | "descending";

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}
