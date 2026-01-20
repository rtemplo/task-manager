import { memo, useCallback } from "react";
import { taskApi } from "../../api/taskApi";
import type { Task, TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./TaskColumn.module.css";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  sortIndicator: string | null;
}

export const TaskColumn: React.FC<TaskColumnProps> = memo(({ status, title, tasks, sortIndicator }) => {
  const {
    groupedTasks,
    draggedTask,
    dragTarget,
    customTaskSequences,
    setError,
    setTasks,
    setGroupedTasks,
    setDragTarget,
    setCustomTaskSequences,
    setRefreshTasks,
  } = useTaskManagerContext();

  // Handle drag over empty column or empty space in column
  const handleColumnDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedTask) return;
      if (dragTarget && dragTarget.status === status) return;

      const updatedGroupedTasks = { ...groupedTasks };

      // Remove from all columns
      for (const columnStatus of ["todo", "in-progress", "done"] as TaskStatus[]) {
        updatedGroupedTasks[columnStatus] = updatedGroupedTasks[columnStatus].filter(
          (t) => t.id !== draggedTask.task.id
        );
      }

      updatedGroupedTasks[status].splice(updatedGroupedTasks[status].length, 0, draggedTask.task);
      setGroupedTasks(updatedGroupedTasks);
      setDragTarget({ status });
    },
    [draggedTask, dragTarget, status, groupedTasks, setGroupedTasks, setDragTarget]
  );

  // Handle drop in empty column or empty space
  const handleColumnDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedTask || !dragTarget) return;

      const sourceStatus = draggedTask.task.status;

      try {
        // Update task status in backend
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
        // If cross-column, also update source column
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

  return (
    <section className={styles.column} aria-label={`${title} column`}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleGroup}>
          <h2 className={styles.columnTitle}>{title}</h2>
          <span className={styles.taskCount}>{tasks.length}</span>
        </div>
        {sortIndicator && <div className={styles.sortIndicator}>{sortIndicator}</div>}
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: div required for drag-and-drop drop zone functionality */}
      <div className={styles.taskList} onDragOver={handleColumnDragOver} onDrop={handleColumnDrop}>
        {tasks.length === 0 ? (
          <p className={styles.emptyState}>No tasks</p>
        ) : (
          tasks.map((task, index) => <TaskCard key={task.id} task={task} index={index} />)
        )}
      </div>
    </section>
  );
});

TaskColumn.displayName = "TaskColumn";
