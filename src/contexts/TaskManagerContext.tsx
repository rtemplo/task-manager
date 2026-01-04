import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { taskApi, userApi } from "../api/taskApi";
import type { ModalMode, Task, User } from "../common/types";

interface ITaskContext {
  loading: boolean;
  tasks: Task[];
  filteredTasks: Task[];
  tasksByStatus: Record<"todo" | "in-progress" | "done", Task[]>;
  users: User[];
  error: string | null;
  modalMode: ModalMode | null;
  draggedTaskId?: string | null;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setModalMode: Dispatch<SetStateAction<ModalMode | null>>;
  setDraggedTaskId: Dispatch<SetStateAction<string | null>>;
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
  setLoading: () => {},
  setTasks: () => {},
  setUsers: () => {},
  setError: () => {},
  setModalMode: () => {},
  setDraggedTaskId: () => {},
});

const TaskManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    // Implement filter logic here (search, assignee, priority, tags, due date)
    // TODO: Apply sorting based on sortOptions state
    return tasks;
  }, [tasks]);

  // TODO: Group tasks by status
  const tasksByStatus = useMemo(() => {
    return {
      todo: filteredTasks.filter((task) => task.status === "todo"),
      "in-progress": filteredTasks.filter((task) => task.status === "in-progress"),
      done: filteredTasks.filter((task) => task.status === "done"),
    };
  }, [filteredTasks]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tasksData, usersData] = await Promise.all([taskApi.getAll(), userApi.getAll()]);
        setTasks(tasksData);
        setUsers(usersData);
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
        setLoading,
        setTasks,
        setUsers,
        setError,
        setModalMode,
        setDraggedTaskId,
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
