import type { AppState, ColumnSortConfig, Task, TaskFormData, TaskStatus, User } from "../common/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new ApiError(response.status, error.message || "An error occurred");
  }
  return response.json();
}

// Task API
export const taskApi = {
  async getAll(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    return handleResponse<Task[]>(response);
  },

  async getById(id: string): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    return handleResponse<Task>(response);
  },

  async create(taskData: Omit<TaskFormData, "id">): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse<Task>(response);
  },

  async update(id: string, taskData: Partial<TaskFormData>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse<Task>(response);
  },

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Task>(response);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "DELETE",
    });
    await handleResponse(response);
  },
};

// User API
export const userApi = {
  async getAll(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    return handleResponse<User[]>(response);
  },

  async getById(id: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    return handleResponse<User>(response);
  },
};

// AppState API
export const appStateApi = {
  async get(userId: string): Promise<AppState> {
    const response = await fetch(`${API_BASE_URL}/app-state/${userId}`);
    return handleResponse<AppState>(response);
  },

  async updateSortConfig(
    userId: string,
    sortConfig: {
      columnSortConfigs: ColumnSortConfig;
    }
  ): Promise<AppState> {
    const response = await fetch(`${API_BASE_URL}/app-state/${userId}/sort-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sortConfig),
    });
    return handleResponse<AppState>(response);
  },

  async reset(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/app-state/${userId}`, {
      method: "DELETE",
    });
    await handleResponse(response);
  },

  async addBookmark(userId: string, taskId: string): Promise<AppState> {
    const response = await fetch(`${API_BASE_URL}/app-state/${userId}/bookmarks/add/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse<AppState>(response);
  },

  async removeBookmark(userId: string, taskId: string): Promise<AppState> {
    const response = await fetch(`${API_BASE_URL}/app-state/${userId}/bookmarks/remove/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse<AppState>(response);
  },
};

// Seed API
export const seedApi = {
  async resetDemo(): Promise<{ message: string; usersInserted: number; tasksInserted: number }> {
    const response = await fetch(`${API_BASE_URL}/seed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse<{ message: string; usersInserted: number; tasksInserted: number }>(response);
  },
};

export { ApiError };
