import { useCallback } from "react";
import { taskApi } from "../api/taskApi";
import type { Task, TaskStatus } from "../common/types";
import { useTaskManagerContext } from "../contexts/TaskManagerContext";

interface UseDragAndDropParams {
  task?: Task;
  index?: number;
  status: TaskStatus;
}

interface DragHandlers {
  // Card-level handlers
  handleCardDragStart: (sourceIndex: number) => void;
  handleCardDragOver: (e: React.DragEvent) => void;
  // Column-level handlers
  handleColumnDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleColumnDrop: (e: React.DragEvent) => Promise<void>;
}

/**
 * Custom hook that encapsulates drag and drop logic for task cards and columns
 * @param params - Configuration object containing task, index, and status
 * @returns Object containing drag and drop event handlers
 */
export const useDragAndDrop = ({ task, index, status }: UseDragAndDropParams): DragHandlers => {
  const {
    groupedTasks,
    draggedTask,
    dragTarget,
    customTaskSequences,
    setError,
    setTasks,
    setGroupedTasks,
    setDraggedTask,
    setDragTarget,
    setCustomTaskSequences,
    setRefreshTasks,
  } = useTaskManagerContext();

  // Handler for when a card starts being dragged
  const handleCardDragStart = useCallback(
    (sourceIndex: number) => {
      if (!task) return;
      setDraggedTask({ index: sourceIndex, task });
    },
    [task, setDraggedTask]
  );

  // Handler for when a card is dragged over another card
  const handleCardDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedTask || !task || index === undefined) return;

      const sourceId = draggedTask.task.id;
      const targetId = task.id;
      const targetStatus = task.status;
      const targetIndex = index;

      // Don't do anything if dragging over itself
      if (sourceId === targetId) return;

      let updatedGroupedTasks = { ...groupedTasks };

      // Remove dragged task from all columns to prevent duplication
      for (const columnStatus of ["todo", "in-progress", "done"] as TaskStatus[]) {
        updatedGroupedTasks[columnStatus] = updatedGroupedTasks[columnStatus].filter(
          (t) => t.id !== draggedTask.task.id
        );
      }

      // Insert dragged task at the target position
      const updatedGroupTasks = [...updatedGroupedTasks[targetStatus]];
      updatedGroupTasks.splice(targetIndex, 0, draggedTask.task);
      updatedGroupTasks[targetIndex] = { ...updatedGroupTasks[targetIndex], status: targetStatus };
      updatedGroupedTasks = { ...updatedGroupedTasks, [targetStatus]: updatedGroupTasks };

      setGroupedTasks(updatedGroupedTasks);
      setDragTarget({ index: targetIndex, status: targetStatus });
    },
    [draggedTask, groupedTasks, task, index, setGroupedTasks, setDragTarget]
  );

  // Handler for when a card is dragged over an empty column or empty space
  const handleColumnDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedTask) return;
      if (dragTarget && dragTarget.status === status) return;

      const updatedGroupedTasks = { ...groupedTasks };

      // Remove dragged task from all columns
      for (const columnStatus of ["todo", "in-progress", "done"] as TaskStatus[]) {
        updatedGroupedTasks[columnStatus] = updatedGroupedTasks[columnStatus].filter(
          (t) => t.id !== draggedTask.task.id
        );
      }

      // Add dragged task to the end of the target column
      updatedGroupedTasks[status].splice(updatedGroupedTasks[status].length, 0, draggedTask.task);
      setGroupedTasks(updatedGroupedTasks);
      setDragTarget({ status });
    },
    [draggedTask, dragTarget, status, groupedTasks, setGroupedTasks, setDragTarget]
  );

  // Handler for when a card is dropped in a column
  const handleColumnDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedTask || !dragTarget) return;

      const sourceStatus = draggedTask.task.status;

      try {
        // Update task status in backend if moving to a different column
        if (sourceStatus !== status) {
          await taskApi.updateStatus(draggedTask.task.id, status);
          // Update local tasks state to reflect the status change
          setTasks((prevTasks) =>
            prevTasks.map((t) => (t.id === draggedTask.task.id ? { ...t, status } : t))
          );
        }

        setRefreshTasks(true);

        // Save custom sequences on successful drop
        const updatedSequences = { ...customTaskSequences };
        updatedSequences[status] = {
          useSequence: true,
          sequence: groupedTasks[status].map((t) => t.id),
        };
        // If cross-column move, also update source column sequence
        if (sourceStatus !== status) {
          updatedSequences[sourceStatus] = {
            useSequence: true,
            sequence: groupedTasks[sourceStatus].map((t) => t.id),
          };
        }
        setCustomTaskSequences(updatedSequences);
      } catch (err) {
        console.error("Error updating task status:", err);
        setError(err instanceof Error ? err.message : "Failed to update task");
      }
    },
    [
      draggedTask,
      dragTarget,
      status,
      groupedTasks,
      customTaskSequences,
      setError,
      setTasks,
      setCustomTaskSequences,
      setRefreshTasks,
    ]
  );

  return {
    handleCardDragStart,
    handleCardDragOver,
    handleColumnDragOver,
    handleColumnDrop,
  };
};
