import { useCallback, useState } from "react";
import { taskApi } from "../../api/taskApi";
import type { TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./TaskBoard.module.css";

export const TaskBoard: React.FC = () => {
  const { tasksByStatus, draggedTaskId, setTasks, setError, setDraggedTaskId } = useTaskManagerContext();
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);
  const [draggedTaskStatus, setDraggedTaskStatus] = useState<TaskStatus | null>(null);

  const handleTaskDragStart = useCallback(
    (taskId: string, status: TaskStatus, index: number) => {
      setDraggedTaskId(taskId);
      setDraggedTaskStatus(status);
      setDraggedTaskIndex(index);
    },
    [setDraggedTaskId]
  );

  const handleTaskDragOver = useCallback(
    (status: TaskStatus, targetIndex: number, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (draggedTaskIndex === null || draggedTaskStatus !== status || draggedTaskIndex === targetIndex) {
        return;
      }

      // Reorder tasks within the same column
      setTasks((prevTasks) => {
        const statusTasks = prevTasks.filter((t) => t.status === status);
        const draggedTask = statusTasks[draggedTaskIndex];

        // Remove from old position and insert at new position
        const reorderedStatusTasks = [...statusTasks];
        reorderedStatusTasks.splice(draggedTaskIndex, 1);
        reorderedStatusTasks.splice(targetIndex, 0, draggedTask);

        // Merge back with tasks from other statuses
        const otherTasks = prevTasks.filter((t) => t.status !== status);
        return [...otherTasks, ...reorderedStatusTasks];
      });

      setDraggedTaskIndex(targetIndex);
    },
    [draggedTaskIndex, draggedTaskStatus, setTasks]
  );

  const handleTaskDragEnd = useCallback(() => {
    setDraggedTaskIndex(null);
    setDraggedTaskStatus(null);
  }, []);

  const handleColumnDragOver: React.DragEventHandler<HTMLDivElement> = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add(styles.dropZoneActive);
  }, []);

  const handleColumnDragLeave: React.DragEventHandler<HTMLDivElement> = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dropZoneActive);
  }, []);

  const handleColumnDrop = useCallback(
    async (status: TaskStatus, e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove(styles.dropZoneActive);

      if (!draggedTaskId || !draggedTaskStatus) return;

      // Only update status if moving to a different column
      if (draggedTaskStatus === status) {
        setDraggedTaskId(null);
        setDraggedTaskStatus(null);
        setDraggedTaskIndex(null);
        return;
      }

      try {
        const updatedTask = await taskApi.updateStatus(draggedTaskId, status);
        setTasks((prevTasks) => prevTasks.map((task) => (task.id === draggedTaskId ? updatedTask : task)));
      } catch (err) {
        console.error("Error updating task status:", err);
        setError(err instanceof Error ? err.message : "Failed to update task");
      } finally {
        setDraggedTaskId(null);
        setDraggedTaskStatus(null);
        setDraggedTaskIndex(null);
      }
    },
    [draggedTaskId, draggedTaskStatus, setTasks, setError, setDraggedTaskId]
  );

  const renderColumn = (status: TaskStatus, title: string) => {
    const columnTasks = tasksByStatus[status];

    return (
      <section
        className={styles.column}
        onDragOver={handleColumnDragOver}
        onDragLeave={handleColumnDragLeave}
        onDrop={(e) => handleColumnDrop(status, e)}
        aria-label={`${title} column`}
        key={title}
      >
        <div className={styles.columnHeader}>
          <h2 className={styles.columnTitle}>{title}</h2>
          <span className={styles.taskCount}>{columnTasks.length}</span>
        </div>
        <div className={styles.taskList}>
          {columnTasks.length === 0 ? (
            <p className={styles.emptyState}>No tasks</p>
          ) : (
            columnTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onDragStart={(taskId) => handleTaskDragStart(taskId, status, index)}
                onDragOver={(e) => handleTaskDragOver(status, index, e)}
                onDragEnd={handleTaskDragEnd}
              />
            ))
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
