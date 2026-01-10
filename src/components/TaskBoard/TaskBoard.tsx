import { useCallback, useMemo } from "react";
import { taskApi } from "../../api/taskApi";
import type { TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./TaskBoard.module.css";

export const TaskBoard: React.FC = () => {
  const {
    groupedTasks,
    appState,
    draggedTask,
    dragTarget,
    customTaskSequences,
    setError,
    setTasks,
    setGroupedTasks,
    setDragTarget,
    setDragCompleted,
    setCustomTaskSequences,
  } = useTaskManagerContext();

  // Handle drag over empty column or empty space in column
  const handleColumnDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedTask) return;

      if (dragTarget && dragTarget.status === targetStatus) return;

      const updatedGroupedTasks = { ...groupedTasks };

      // Remove from all columns
      for (const status of ["todo", "in-progress", "done"] as TaskStatus[]) {
        updatedGroupedTasks[status] = updatedGroupedTasks[status].filter((t) => t.id !== draggedTask.task.id);
      }

      updatedGroupedTasks[targetStatus].splice(updatedGroupedTasks[targetStatus].length, 0, draggedTask.task);
      setGroupedTasks(updatedGroupedTasks);
      setDragTarget({ status: targetStatus });
    },
    [draggedTask, dragTarget, groupedTasks, setGroupedTasks, setDragTarget]
  );

  // Handle drop in empty column or empty space
  const handleColumnDrop = useCallback(
    async (e: React.DragEvent, targetStatus: TaskStatus) => {
      e.preventDefault();

      if (!draggedTask || !dragTarget) {
        setDragCompleted(false);
        return;
      }

      const sourceStatus = draggedTask.task.status;

      try {
        // Update task status in backend
        if (sourceStatus !== targetStatus) {
          await taskApi.updateStatus(draggedTask.task.id, targetStatus);
          // Update local tasks state to reflect the status change
          setTasks((prevTasks) =>
            prevTasks.map((t) => (t.id === draggedTask.task.id ? { ...t, status: targetStatus } : t))
          );
        }
        setDragCompleted(true);

        // Save custom sequences on successful drop
        const updatedSequences = { ...customTaskSequences };
        updatedSequences[targetStatus] = {
          useSequence: true,
          sequence: groupedTasks[targetStatus].map((t) => t.id),
        };
        // If cross-column, also update source column
        if (sourceStatus !== targetStatus) {
          updatedSequences[sourceStatus] = {
            useSequence: true,
            sequence: groupedTasks[sourceStatus].map((t) => t.id),
          };
        }
        setCustomTaskSequences(updatedSequences);
      } catch (err) {
        setDragCompleted(false);
        console.error("Error updating task status:", err);
        setError(err instanceof Error ? err.message : "Failed to update task");
      }
    },
    [
      draggedTask,
      dragTarget,
      groupedTasks,
      customTaskSequences,
      setError,
      setTasks,
      setDragCompleted,
      setCustomTaskSequences,
    ]
  );

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

  const renderColumn = (status: TaskStatus, title: string) => {
    const columnTasks = groupedTasks[status];
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
