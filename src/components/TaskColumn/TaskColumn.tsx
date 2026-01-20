import { memo } from "react";
import type { Task, TaskStatus } from "../../common/types";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./TaskColumn.module.css";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  sortIndicator: string | null;
}

export const TaskColumn: React.FC<TaskColumnProps> = memo(({ status, title, tasks, sortIndicator }) => {
  const { handleColumnDragOver, handleColumnDrop } = useDragAndDrop({ status });

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
