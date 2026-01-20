import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { appStateApi, taskApi, userApi } from "../api/taskApi";
import type {
  AppState,
  CustomTaskSequences,
  GroupedTasks,
  ModalMode,
  SortOption,
  Task,
  TaskStatus,
  User,
} from "../common/types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useTaskFiltering } from "../hooks/useTaskFiltering";
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

  // Apply custom sequence ordering to tasks
  const applyCustomSequence = useCallback((tasks: Task[], sequence: string[]): Task[] => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const ordered: Task[] = [];

    // Add tasks in sequence order
    for (const id of sequence) {
      const task = taskMap.get(id);
      if (task) {
        ordered.push(task);
        taskMap.delete(id);
      }
    }

    // Append new tasks not in sequence to the bottom
    for (const task of taskMap.values()) {
      ordered.push(task);
    }

    return ordered;
  }, []);

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

  useEffect(() => {
    /**
     * This useEffect updates groupedTasks and applies sorting based on any existing custom
     * configurations made through the sorting modal panel or custom drag-and-drop sequences.
     */
    const updatedGroupedTasks = Object.groupBy(filteredTasks, (task) => task.status) as Record<
      TaskStatus,
      Task[]
    >;

    for (const status of ["todo", "in-progress", "done"] as TaskStatus[]) {
      if (!updatedGroupedTasks[status]) {
        updatedGroupedTasks[status] = [];
      }
    }

    // Create users map for efficient lookup
    const usersMap = new Map(users.map((u) => [u.id, u]));

    // Apply custom sequence or sort configuration for each column
    for (const status of ["todo", "in-progress", "done"] as TaskStatus[]) {
      if (customTaskSequences[status].useSequence) {
        // Custom drag-and-drop order takes precedence
        updatedGroupedTasks[status] = applyCustomSequence(
          updatedGroupedTasks[status],
          customTaskSequences[status].sequence
        );
      } else if (columnSortConfigs?.[status] && columnSortConfigs[status].length > 0) {
        // Apply sort modal configuration if no custom sequence
        updatedGroupedTasks[status] = sortTasks(
          updatedGroupedTasks[status],
          columnSortConfigs[status],
          usersMap
        );
      }
    }

    setGroupedTasks(updatedGroupedTasks);
  }, [filteredTasks, columnSortConfigs, users, sortTasks, customTaskSequences, applyCustomSequence]);

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
