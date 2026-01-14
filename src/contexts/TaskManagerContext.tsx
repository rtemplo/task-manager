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
  dragCompleted?: boolean;
  appState: AppState | null;
  customTaskSequences: CustomTaskSequences;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setGroupedTasks: Dispatch<SetStateAction<GroupedTasks>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setModalMode: Dispatch<SetStateAction<ModalMode | null>>;
  setDraggedTask: Dispatch<SetStateAction<{ index: number; task: Task } | null>>;
  setDragTarget: Dispatch<SetStateAction<{ index?: number; status: TaskStatus } | null>>;
  setDragCompleted: Dispatch<SetStateAction<boolean | undefined>>;
  setAppState: Dispatch<SetStateAction<AppState | null>>;
  setCustomTaskSequences: Dispatch<SetStateAction<CustomTaskSequences>>;
  applyFilters: () => void;
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
  dragCompleted: undefined,
  appState: null,
  customTaskSequences: {
    todo: { useSequence: false, sequence: [] },
    "in-progress": { useSequence: false, sequence: [] },
    done: { useSequence: false, sequence: [] },
  },
  setLoading: () => {},
  setTasks: () => {},
  setGroupedTasks: () => {},
  setUsers: () => {},
  setError: () => {},
  setModalMode: () => {},
  setDraggedTask: () => {},
  setDragTarget: () => {},
  setDragCompleted: () => {},
  setAppState: () => {},
  setCustomTaskSequences: () => {},
  applyFilters: () => {},
});

const TaskManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultGroupedTasks: GroupedTasks = {
    todo: [],
    "in-progress": [],
    done: [],
  };

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>(defaultGroupedTasks);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [draggedTask, setDraggedTask] = useState<{
    index: number;
    task: Task;
  } | null>(null);
  const [dragTarget, setDragTarget] = useState<{ index?: number; status: TaskStatus } | null>(null);
  const [dragCompleted, setDragCompleted] = useState<boolean | undefined>(undefined);
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

  const { filterState } = useTaskFilterContext();

  const applyFilters = useCallback(() => {
    let updatedTasks = [...tasks];
    const { assigneeIds, priorities, dueDateRange } = filterState;
    // Filter by assignee IDs
    if (assigneeIds.length > 0) {
      updatedTasks = updatedTasks.filter((task) => assigneeIds.includes(task.assigneeId));
    }
    // Filter by priorities
    if (priorities.length > 0) {
      updatedTasks = updatedTasks.filter((task) => priorities.includes(task.priority));
    }
    // Filter by due date range
    if (dueDateRange) {
      const fromDate = dueDateRange.from ? new Date(dueDateRange.from) : null;
      const toDate = dueDateRange.to ? new Date(dueDateRange.to) : null;
      updatedTasks = updatedTasks.filter((task) => {
        const taskDueDate = new Date(task.dueDate);
        if (fromDate && taskDueDate < fromDate) return false;
        if (toDate && taskDueDate > toDate) return false;
        return true;
      });
    }
    if (filterState.query.trim() !== "") {
      const queryLower = filterState.query.toLowerCase();
      updatedTasks = updatedTasks.filter((task) => {
        const titleMatch = task.title.toLowerCase().includes(queryLower);
        const descriptionMatch = task.description.toLowerCase().includes(queryLower);
        const tagsMatch = task.tags.some((tag) => tag.toLowerCase().includes(queryLower));
        if (filterState.searchBy === "title") return titleMatch;
        if (filterState.searchBy === "description") return descriptionMatch;
        if (filterState.searchBy === "tags") return tagsMatch;
        return titleMatch || descriptionMatch || tagsMatch;
      });
    }
    setFilteredTasks(updatedTasks);
  }, [tasks, filterState]);

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
    // if (filteredTasks.length > 0) {
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
    // }
  }, [filteredTasks, columnSortConfigs, users, sortTasks, customTaskSequences, applyCustomSequence]);

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
        setFilteredTasks(tasksData);
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
        groupedTasks,
        users,
        error,
        modalMode,
        draggedTask,
        dragTarget,
        dragCompleted,
        appState,
        customTaskSequences,
        setLoading,
        setTasks,
        setGroupedTasks,
        setUsers,
        setError,
        setModalMode,
        setDraggedTask,
        setDragTarget,
        setDragCompleted,
        setAppState,
        setCustomTaskSequences,
        applyFilters,
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
