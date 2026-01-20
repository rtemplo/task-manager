import { useCallback, useMemo } from "react";
import type {
  ColumnSortConfig,
  CustomTaskSequences,
  GroupedTasks,
  SortOption,
  Task,
  TaskStatus,
  User,
} from "../common/types";

/**
 * Custom hook that groups filtered tasks by status and applies sorting/custom sequences
 * @param filteredTasks - Array of already filtered tasks
 * @param users - Array of all users (for assignee sorting)
 * @param customTaskSequences - Custom drag-and-drop sequences per column
 * @param columnSortConfigs - Sort configurations per column from sort modal
 * @returns Grouped and sorted tasks by status
 */
export const useTaskSorting = (
  filteredTasks: Task[],
  users: User[],
  customTaskSequences: CustomTaskSequences,
  columnSortConfigs?: ColumnSortConfig
): GroupedTasks => {
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

  // Memoize the grouping and sorting logic
  const groupedTasks = useMemo(() => {
    // Group tasks by status
    const grouped = Object.groupBy(filteredTasks, (task) => task.status) as Record<TaskStatus, Task[]>;

    // Initialize empty arrays for missing statuses
    const statuses: TaskStatus[] = ["todo", "in-progress", "done"];
    for (const status of statuses) {
      if (!grouped[status]) {
        grouped[status] = [];
      }
    }

    // Create users map for efficient lookup
    const usersMap = new Map(users.map((u) => [u.id, u]));

    // Apply custom sequence or sort configuration for each column
    for (const status of statuses) {
      if (customTaskSequences[status].useSequence) {
        // Custom drag-and-drop order takes precedence
        grouped[status] = applyCustomSequence(grouped[status], customTaskSequences[status].sequence);
      } else if (columnSortConfigs?.[status]?.length) {
        // Apply sort modal configuration if no custom sequence
        grouped[status] = sortTasks(grouped[status], columnSortConfigs[status], usersMap);
      }
    }

    return grouped;
  }, [filteredTasks, columnSortConfigs, users, customTaskSequences, sortTasks, applyCustomSequence]);

  return groupedTasks;
};
