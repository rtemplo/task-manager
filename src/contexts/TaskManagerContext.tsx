import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { appStateApi, taskApi, userApi } from "../api/taskApi";
import type { AppState, ModalMode, SortOption, Task, User } from "../common/types";

const USER_ID = "default-user"; // TODO: Replace with actual user auth

interface ITaskContext {
  loading: boolean;
  tasks: Task[];
  filteredTasks: Task[];
  tasksByStatus: Record<"todo" | "in-progress" | "done", Task[]>;
  users: User[];
  error: string | null;
  modalMode: ModalMode | null;
  draggedTaskId?: string | null;
  appState: AppState | null;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setModalMode: Dispatch<SetStateAction<ModalMode | null>>;
  setDraggedTaskId: Dispatch<SetStateAction<string | null>>;
  setAppState: Dispatch<SetStateAction<AppState | null>>;
}

const TaskManagerContext = createContext<ITaskContext>({
  loading: true,
  tasks: [],
  filteredTasks: [],
  tasksByStatus: { todo: [], "in-progress": [], done: [] },
  users: [],
  error: null,
  modalMode: null,
  draggedTaskId: null,
  appState: null,
  setLoading: () => {},
  setTasks: () => {},
  setUsers: () => {},
  setError: () => {},
  setModalMode: () => {},
  setDraggedTaskId: () => {},
  setAppState: () => {},
});

const TaskManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);

  const filteredTasks = useMemo(() => {
    // Implement filter logic here (search, assignee, priority, tags, due date)
    // TODO: Apply filtering based on filter state
    return tasks;
  }, [tasks]);

  // Sort tasks based on SortOption configuration
  const sortTasks = useCallback(
    (tasksToSort: Task[], sortOptions: SortOption[], usersMap: Map<string, User>): Task[] => {
      if (!sortOptions || sortOptions.length === 0) {
        return tasksToSort;
      }

      const sorted = [...tasksToSort];

      sorted.sort((a, b) => {
        for (const option of sortOptions) {
          let comparison = 0;

          switch (option.field) {
            case "dueDate":
              comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              break;
            case "priority": {
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
              break;
            }
            case "assignee": {
              const assigneeA = usersMap.get(a.assigneeId)?.name || "";
              const assigneeB = usersMap.get(b.assigneeId)?.name || "";
              comparison = assigneeA.localeCompare(assigneeB);
              break;
            }
          }

          if (comparison !== 0) {
            return option.direction === "ascending" ? comparison : -comparison;
          }
        }

        return 0;
      });

      return sorted;
    },
    []
  );

  // Group tasks by status and apply sorting
  const tasksByStatus = useMemo(() => {
    const grouped = {
      todo: filteredTasks.filter((task) => task.status === "todo"),
      "in-progress": filteredTasks.filter((task) => task.status === "in-progress"),
      done: filteredTasks.filter((task) => task.status === "done"),
    };

    // Create users map for efficient lookup
    const usersMap = new Map(users.map((u) => [u.id, u]));

    // Apply sort configuration from SortModal
    if (appState?.tasks.sort.columnConfigs) {
      const { columnConfigs } = appState.tasks.sort;

      if (columnConfigs.todo && columnConfigs.todo.length > 0) {
        grouped.todo = sortTasks(grouped.todo, columnConfigs.todo, usersMap);
      }

      if (columnConfigs["in-progress"] && columnConfigs["in-progress"].length > 0) {
        grouped["in-progress"] = sortTasks(grouped["in-progress"], columnConfigs["in-progress"], usersMap);
      }

      if (columnConfigs.done && columnConfigs.done.length > 0) {
        grouped.done = sortTasks(grouped.done, columnConfigs.done, usersMap);
      }
    }

    return grouped;
  }, [filteredTasks, appState, users, sortTasks]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tasksData, usersData, appStateData] = await Promise.all([
          taskApi.getAll(),
          userApi.getAll(),
          appStateApi.get(USER_ID),
        ]);
        setTasks(tasksData);
        setUsers(usersData);
        setAppState(appStateData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <TaskManagerContext.Provider
      value={{
        loading,
        tasks,
        filteredTasks,
        tasksByStatus,
        users,
        error,
        modalMode,
        draggedTaskId,
        appState,
        setLoading,
        setTasks,
        setUsers,
        setError,
        setModalMode,
        setDraggedTaskId,
        setAppState,
      }}
    >
      {children}
    </TaskManagerContext.Provider>
  );
};

const useTaskManagerContext = () => {
  const context = useContext(TaskManagerContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskManagerProvider");
  }
  return context;
};

export { TaskManagerProvider, useTaskManagerContext };
