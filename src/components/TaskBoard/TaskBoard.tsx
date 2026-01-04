import { useCallback } from "react";
import { taskApi } from "../../api/taskApi";
import type { TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./TaskBoard.module.css";

export const TaskBoard: React.FC = () => {
  const { tasksByStatus, draggedTaskId, setTasks, setError, setDraggedTaskId } = useTaskManagerContext();

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add(styles.dropZoneActive);
  }, []);

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dropZoneActive);
  }, []);

  const handleDrop = useCallback(
    async (status: TaskStatus, e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove(styles.dropZoneActive);

      if (!draggedTaskId) return;

      try {
        const updatedTask = await taskApi.updateStatus(draggedTaskId, status);
        setTasks((prevTasks) => prevTasks.map((task) => (task.id === draggedTaskId ? updatedTask : task)));
      } catch (err) {
        console.error("Error updating task status:", err);
        setError(err instanceof Error ? err.message : "Failed to update task");
      } finally {
        setDraggedTaskId(null);
      }
    },
    [draggedTaskId, setTasks, setError, setDraggedTaskId]
  );

  const renderColumn = (status: TaskStatus, title: string) => {
    const columnTasks = tasksByStatus[status];

    return (
      <section
        className={styles.column}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(status, e)}
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
            columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
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
