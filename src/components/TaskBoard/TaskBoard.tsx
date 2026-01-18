import { useMemo } from "react";
import type { TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { TaskColumn } from "../TaskColumn/TaskColumn";
import styles from "./TaskBoard.module.css";

export const TaskBoard: React.FC = () => {
  const { groupedTasks, appState, customTaskSequences } = useTaskManagerContext();

  // Memoize tasks for each column to prevent unnecessary re-renders
  const todoTasks = useMemo(() => groupedTasks.todo, [groupedTasks.todo]);
  const inProgressTasks = useMemo(() => groupedTasks["in-progress"], [groupedTasks["in-progress"]]);
  const doneTasks = useMemo(() => groupedTasks.done, [groupedTasks.done]);

  // Get sort indicator text for a column
  const getSortIndicator = useMemo(() => {
    return (status: TaskStatus): string | null => {
      if (!appState) return null;

      // Check for custom drag-and-drop sequence first
      if (customTaskSequences[status].useSequence) {
        return "Custom";
      }

      // Check for configured sort from sort modal
      const sortConfig = appState.tasks.sort.columnSortConfigs[status];
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
  }, [appState, customTaskSequences]);

  return (
    <div className={styles.board}>
      <TaskColumn status="todo" title="To Do" tasks={todoTasks} sortIndicator={getSortIndicator("todo")} />
      <TaskColumn
        status="in-progress"
        title="In Progress"
        tasks={inProgressTasks}
        sortIndicator={getSortIndicator("in-progress")}
      />
      <TaskColumn status="done" title="Done" tasks={doneTasks} sortIndicator={getSortIndicator("done")} />
    </div>
  );
};
