import type { TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./TaskBoard.module.css";

export const TaskBoard: React.FC = () => {
  const { tasksByStatus } = useTaskManagerContext();

  const renderColumn = (status: TaskStatus, title: string) => {
    const columnTasks = tasksByStatus[status];

    return (
      <section className={styles.column} aria-label={`${title} column`} key={title}>
        <div className={styles.columnHeader}>
          <h2 className={styles.columnTitle}>{title}</h2>
          <span className={styles.taskCount}>{columnTasks.length}</span>
        </div>
        <div className={styles.taskList}>
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
