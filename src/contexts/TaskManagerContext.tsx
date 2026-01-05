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
import type { AppState, ModalMode, Task, TaskStatus, User } from "../common/types";

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
  saveCustomSort: (columnStatus: TaskStatus, taskIds: string[]) => Promise<void>;
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
  saveCustomSort: async () => {},
});

const TaskManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);

  // Helper to check if sequence matches default order
  const sequenceMatchesDefault = useCallback((sequence: string[], defaultTasks: Task[]): boolean => {
    if (sequence.length !== defaultTasks.length) return false;
    return sequence.every((id, index) => id === defaultTasks[index].id);
  }, []);

  // Save custom sort to backend
  const saveCustomSort = async (columnStatus: TaskStatus, taskIds: string[]) => {
    if (!appState) return;

    try {
      const customSort = {
        useCustomSort: true,
        toDoListSeq: columnStatus === "todo" ? taskIds : appState.tasks.customSort.toDoListSeq,
        inProgListSeq: columnStatus === "in-progress" ? taskIds : appState.tasks.customSort.inProgListSeq,
        completedListSeq: columnStatus === "done" ? taskIds : appState.tasks.customSort.completedListSeq,
      };

      const updatedAppState = await appStateApi.updateCustomSort(USER_ID, customSort);
      setAppState(updatedAppState);
    } catch (err) {
      console.error("Error saving custom sort:", err);
      setError(err instanceof Error ? err.message : "Failed to save custom sort");
    }
  };

  const filteredTasks = useMemo(() => {
    // Implement filter logic here (search, assignee, priority, tags, due date)
    // TODO: Apply sorting based on sortOptions state
    return tasks;
  }, [tasks]);

  // Group tasks by status and apply custom sort if enabled
  const tasksByStatus = useMemo(() => {
    const grouped = {
      todo: filteredTasks.filter((task) => task.status === "todo"),
      "in-progress": filteredTasks.filter((task) => task.status === "in-progress"),
      done: filteredTasks.filter((task) => task.status === "done"),
    };

    // Apply custom sort if enabled and sequences exist
    if (appState?.tasks.customSort.useCustomSort) {
      const { toDoListSeq, inProgListSeq, completedListSeq } = appState.tasks.customSort;

      // Sort todo column
      if (toDoListSeq.length > 0) {
        grouped.todo = toDoListSeq
          .map((id) => grouped.todo.find((task) => task.id === id))
          .filter((task): task is Task => task !== undefined);
      }

      // Sort in-progress column
      if (inProgListSeq.length > 0) {
        grouped["in-progress"] = inProgListSeq
          .map((id) => grouped["in-progress"].find((task) => task.id === id))
          .filter((task): task is Task => task !== undefined);
      }

      // Sort done column
      if (completedListSeq.length > 0) {
        grouped.done = completedListSeq
          .map((id) => grouped.done.find((task) => task.id === id))
          .filter((task): task is Task => task !== undefined);
      }
    }

    return grouped;
  }, [filteredTasks, appState]);

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

        // Clean orphaned IDs from sequences
        if (appStateData.tasks.customSort.useCustomSort) {
          const taskIds = new Set(tasksData.map((t) => t.id));
          const todoTasks = tasksData.filter((t) => t.status === "todo");
          const inProgTasks = tasksData.filter((t) => t.status === "in-progress");
          const doneTasks = tasksData.filter((t) => t.status === "done");

          const cleanToDoSeq = appStateData.tasks.customSort.toDoListSeq.filter((id) => taskIds.has(id));
          const cleanInProgSeq = appStateData.tasks.customSort.inProgListSeq.filter((id) => taskIds.has(id));
          const cleanCompletedSeq = appStateData.tasks.customSort.completedListSeq.filter((id) =>
            taskIds.has(id)
          );

          const hasOrphans =
            cleanToDoSeq.length !== appStateData.tasks.customSort.toDoListSeq.length ||
            cleanInProgSeq.length !== appStateData.tasks.customSort.inProgListSeq.length ||
            cleanCompletedSeq.length !== appStateData.tasks.customSort.completedListSeq.length;

          // Check if cleaned sequences match default order
          const todoMatchesDefault = sequenceMatchesDefault(cleanToDoSeq, todoTasks);
          const inProgMatchesDefault = sequenceMatchesDefault(cleanInProgSeq, inProgTasks);
          const doneMatchesDefault = sequenceMatchesDefault(cleanCompletedSeq, doneTasks);
          const allMatchDefault = todoMatchesDefault && inProgMatchesDefault && doneMatchesDefault;

          if (hasOrphans || allMatchDefault) {
            // Update or reset sequences
            const updatedCustomSort = {
              useCustomSort: !allMatchDefault,
              toDoListSeq: allMatchDefault ? [] : cleanToDoSeq,
              inProgListSeq: allMatchDefault ? [] : cleanInProgSeq,
              completedListSeq: allMatchDefault ? [] : cleanCompletedSeq,
            };

            const updatedAppState = await appStateApi.updateCustomSort(USER_ID, updatedCustomSort);
            setAppState(updatedAppState);
          } else {
            setAppState(appStateData);
          }
        } else {
          setAppState(appStateData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sequenceMatchesDefault]);

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
        saveCustomSort,
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
