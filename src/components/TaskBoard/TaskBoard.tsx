import { useCallback, useMemo } from "react";
import { taskApi } from "../../api/taskApi";
import type { TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./TaskBoard.module.css";

export const TaskBoard: React.FC = () => {
  const { tasksByStatus, appState, draggedTaskId, tasks, setTasks, setError, saveCustomSort } =
    useTaskManagerContext();

  // Handle drag over empty column or empty space in column
  const handleColumnDragOver = useCallback(
    (e: React.DragEvent, targetStatus: TaskStatus) => {
      e.preventDefault();

      if (!draggedTaskId) return;

      // Find the dragged task
      const draggedTask = tasks.find((t) => t.id === draggedTaskId);
      if (!draggedTask) return;

      const sourceStatus = draggedTask.status;

      // Only handle cross-column moves (same-column handled by TaskCard)
      if (sourceStatus === targetStatus) return;

      // Move task to the end of the target column
      setTasks((prevTasks) => {
        const tasksWithoutDragged = prevTasks.filter((t) => t.id !== draggedTaskId);
        const targetColumnTasks = tasksWithoutDragged.filter((t) => t.status === targetStatus);
        const otherColumnTasks = tasksWithoutDragged.filter((t) => t.status !== targetStatus);

        // Add dragged task to end of target column with updated status
        const updatedTask = { ...draggedTask, status: targetStatus };
        return [...otherColumnTasks, ...targetColumnTasks, updatedTask];
      });
    },
    [draggedTaskId, tasks, setTasks]
  );

  // Handle drop in empty column or empty space
  const handleColumnDrop = useCallback(
    async (e: React.DragEvent, targetStatus: TaskStatus) => {
      e.preventDefault();

      if (!draggedTaskId) return;

      try {
        // Update task status in backend
        await taskApi.updateStatus(draggedTaskId, targetStatus);

        // Save custom sort for the target column
        const targetColumnTasks = tasks
          .filter((t) => t.status === targetStatus || t.id === draggedTaskId)
          .map((t) => (t.id === draggedTaskId ? { ...t, status: targetStatus } : t));
        const taskIds = targetColumnTasks.map((t) => t.id);
        saveCustomSort(targetStatus, taskIds);
      } catch (err) {
        console.error("Error updating task status:", err);
        setError(err instanceof Error ? err.message : "Failed to update task");
      }
    },
    [draggedTaskId, tasks, saveCustomSort, setError]
  );

  // Get sort indicator text for a column
  const getSortIndicator = useMemo(() => {
    return (status: TaskStatus): string | null => {
      if (!appState) return null;

      // Check if custom sort is enabled
      if (appState.tasks.customSort.useCustomSort) {
        const sequences = {
          todo: appState.tasks.customSort.toDoListSeq,
          "in-progress": appState.tasks.customSort.inProgListSeq,
          done: appState.tasks.customSort.completedListSeq,
        };

        if (sequences[status].length > 0) {
          return "Custom Order";
        }
      }

      // Check for configured sort
      const sortConfig = appState.tasks.sort.columnConfigs[status];
      if (sortConfig && sortConfig.length > 0) {
        const sortParts = sortConfig.map((opt) => {
          const fieldLabel =
            opt.field === "dueDate" ? "Due Date" : opt.field === "priority" ? "Priority" : "Assignee";
          const directionSymbol = opt.direction === "ascending" ? "↑" : "↓";
          return `${fieldLabel} ${directionSymbol}`;
        });
        return sortParts.join(", ");
      }

      return null;
    };
  }, [appState]);

  const renderColumn = (status: TaskStatus, title: string) => {
    const columnTasks = tasksByStatus[status];
    const sortIndicator = getSortIndicator(status);

    return (
      <section className={styles.column} aria-label={`${title} column`} key={title}>
        <div className={styles.columnHeader}>
          <div className={styles.columnTitleGroup}>
            <h2 className={styles.columnTitle}>{title}</h2>
            <span className={styles.taskCount}>{columnTasks.length}</span>
          </div>
          {sortIndicator && <div className={styles.sortIndicator}>{sortIndicator}</div>}
        </div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: div required for drag-and-drop drop zone functionality */}
        <div
          className={styles.taskList}
          onDragOver={(e) => handleColumnDragOver(e, status)}
          onDrop={(e) => handleColumnDrop(e, status)}
        >
          {columnTasks.length === 0 ? (
            <p className={styles.emptyState}>No tasks</p>
          ) : (
            columnTasks.map((task, index) => <TaskCard key={task.id} task={task} index={index} />)
          )}
        </div>
      </section>
    );
  };

  return (
    <div className={styles.board}>
      {renderColumn("todo", "To Do")}
      {renderColumn("in-progress", "In Progress")}
      {renderColumn("done", "Done")}
    </div>
  );
};
