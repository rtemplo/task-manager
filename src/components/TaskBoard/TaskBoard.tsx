import { useMemo } from "react";
import type { TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./TaskBoard.module.css";

export const TaskBoard: React.FC = () => {
  const { tasksByStatus, appState } = useTaskManagerContext();

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
