import { useMemo } from "react";
import type { FilterState, Task } from "../common/types";

export const useTaskFiltering = (
  tasks: Task[],
  appliedFilters: FilterState,
  searchQuery: string,
  bookmarks: string[] = []
) => {
  return useMemo(() => {
    let filteredTasks = tasks;
    const { assigneeIds, priorities, dueDateRange, searchBy, showBookmarkedOnly } = appliedFilters;

    // Filter by assignee IDs
    if (assigneeIds.length > 0) {
      filteredTasks = filteredTasks.filter((task) => assigneeIds.includes(task.assigneeId));
    }

    // Filter by priorities
    if (priorities.length > 0) {
      filteredTasks = filteredTasks.filter((task) => priorities.includes(task.priority));
    }

    // Filter by bookmarked only
    if (showBookmarkedOnly) {
      filteredTasks = filteredTasks.filter((task) => bookmarks.includes(task.id));
    }

    // Filter by due date range
    if (dueDateRange?.from || dueDateRange?.to) {
      const fromDate = dueDateRange.from ? new Date(dueDateRange.from) : null;
      const toDate = dueDateRange.to ? new Date(dueDateRange.to) : null;
      filteredTasks = filteredTasks.filter((task) => {
        const taskDueDate = new Date(task.dueDate);
        if (fromDate && taskDueDate < fromDate) return false;
        if (toDate && taskDueDate > toDate) return false;
        return true;
      });
    }

    // Apply search query filter
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      const queryLower = trimmedQuery.toLowerCase();
      filteredTasks = filteredTasks.filter((task) => {
        const titleMatch = task.title.toLowerCase().includes(queryLower);
        const descriptionMatch = task.description.toLowerCase().includes(queryLower);
        const tagsMatch = task.tags.some((tag) => tag.toLowerCase().includes(queryLower));

        switch (searchBy) {
          case "title":
            return titleMatch;
          case "description":
            return descriptionMatch;
          case "tags":
            return tagsMatch;
          default:
            return titleMatch || descriptionMatch || tagsMatch;
        }
      });
    }

    return filteredTasks;
  }, [tasks, appliedFilters, searchQuery, bookmarks]);
};
