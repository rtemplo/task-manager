import { createContext, type Dispatch, type SetStateAction, useContext, useEffect, useState } from "react";
import { appStateApi, taskApi, userApi } from "../api/taskApi";
import type {
  AppState,
  CustomTaskSequences,
  GroupedTasks,
  ModalMode,
  Task,
  TaskStatus,
  User,
} from "../common/types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useTaskFiltering } from "../hooks/useTaskFiltering";
import { useTaskSorting } from "../hooks/useTaskSorting";
import { useTaskFilterContext } from "./TaskManagerFilterContext";

const USER_ID = "default-user"; // TODO: Replace with actual user auth

interface ITaskContext {
  loading: boolean;
  tasks: Task[];
  groupedTasks: GroupedTasks;
  users: User[];
  error: string | null;
  modalMode: ModalMode | null;
  draggedTask?: { index: number; task: Task } | null;
  dragTarget?: { index?: number; status: TaskStatus } | null;
  appState: AppState | null;
  customTaskSequences: CustomTaskSequences;
  refreshTasks: boolean;
  searchQuery: string;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setGroupedTasks: Dispatch<SetStateAction<GroupedTasks>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setModalMode: Dispatch<SetStateAction<ModalMode | null>>;
  setDraggedTask: Dispatch<SetStateAction<{ index: number; task: Task } | null>>;
  setDragTarget: Dispatch<SetStateAction<{ index?: number; status: TaskStatus } | null>>;
  setAppState: Dispatch<SetStateAction<AppState | null>>;
  setCustomTaskSequences: Dispatch<SetStateAction<CustomTaskSequences>>;
  setRefreshTasks: Dispatch<SetStateAction<boolean>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

const TaskManagerContext = createContext<ITaskContext>({
  loading: true,
  tasks: [],
  groupedTasks: { todo: [], "in-progress": [], done: [] },
  users: [],
  error: null,
  modalMode: null,
  draggedTask: null,
  dragTarget: null,
  appState: null,
  customTaskSequences: {
    todo: { useSequence: false, sequence: [] },
    "in-progress": { useSequence: false, sequence: [] },
    done: { useSequence: false, sequence: [] },
  },
  refreshTasks: false,
  searchQuery: "",
  setLoading: () => {},
  setTasks: () => {},
  setGroupedTasks: () => {},
  setUsers: () => {},
  setError: () => {},
  setModalMode: () => {},
  setDraggedTask: () => {},
  setDragTarget: () => {},
  setAppState: () => {},
  setCustomTaskSequences: () => {},
  setRefreshTasks: () => {},
  setSearchQuery: () => {},
});

const TaskManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultGroupedTasks: GroupedTasks = {
    todo: [],
    "in-progress": [],
    done: [],
  };

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>(defaultGroupedTasks);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [refreshTasks, setRefreshTasks] = useState(false);
  const [draggedTask, setDraggedTask] = useState<{
    index: number;
    task: Task;
  } | null>(null);
  const [dragTarget, setDragTarget] = useState<{ index?: number; status: TaskStatus } | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [customTaskSequences, setCustomTaskSequences] = useLocalStorage<CustomTaskSequences>(
    "task-manager-custom-sequences",
    {
      todo: { useSequence: false, sequence: [] },
      "in-progress": { useSequence: false, sequence: [] },
      done: { useSequence: false, sequence: [] },
    }
  );

  const columnSortConfigs = appState?.tasks.sort.columnSortConfigs;
  const { appliedFilters } = useTaskFilterContext();

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

  const filteredTasks = useTaskFiltering(tasks, appliedFilters, searchQuery);
  const sortedGroupedTasks = useTaskSorting(filteredTasks, users, customTaskSequences, columnSortConfigs);

  // Sync the memoized grouped tasks with local state for drag-and-drop updates
  useEffect(() => {
    setGroupedTasks(sortedGroupedTasks);
  }, [sortedGroupedTasks]);

  return (
    <TaskManagerContext.Provider
      value={{
        loading,
        tasks,
        groupedTasks,
        users,
        error,
        modalMode,
        draggedTask,
        dragTarget,
        appState,
        customTaskSequences,
        refreshTasks,
        searchQuery,
        setLoading,
        setTasks,
        setGroupedTasks,
        setUsers,
        setError,
        setModalMode,
        setDraggedTask,
        setDragTarget,
        setAppState,
        setCustomTaskSequences,
        setRefreshTasks,
        setSearchQuery,
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
