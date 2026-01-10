import { useCallback } from "react";
import { FaRegEdit } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import { taskApi } from "../../api/taskApi";
import type { Task, TaskStatus } from "../../common/types";
import { useTaskForm } from "../../contexts/TaskFormContext";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const {
    users,
    tasks,
    groupedTasks,
    draggedTask,
    dragTarget,
    dragCompleted,
    customTaskSequences,
    setModalMode,
    setTasks,
    setGroupedTasks,
    setError,
    setDraggedTask,
    setDragTarget,
    setDragCompleted,
    setCustomTaskSequences,
  } = useTaskManagerContext();
  const { setTaskFormData } = useTaskForm();

  const user = users.find((user) => user.id === task.assigneeId);
  const overdue = task.dueDate < new Date().toISOString() && task.status !== "done";

  const handleDragStart = useCallback(
    (sourceIndex: number) => {
      setDraggedTask({ index: sourceIndex, task });
    },
    [task, setDraggedTask]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedTask) return;

      let updatedGroupedTasks = { ...groupedTasks };

      // Remove from all columns to prevent duplication
      for (const status of ["todo", "in-progress", "done"] as TaskStatus[]) {
        updatedGroupedTasks[status] = updatedGroupedTasks[status].filter((t) => t.id !== draggedTask.task.id);
      }

      const sourceIndex = draggedTask.index;
      const sourceStatus = draggedTask.task.status;
      const targetStatus = task.status;
      const targetIndex = index;

      if (sourceStatus === targetStatus && sourceIndex === targetIndex) return;

      const updatedGroupTasks = [...updatedGroupedTasks[targetStatus]];

      updatedGroupTasks.splice(targetIndex, 0, draggedTask.task);
      updatedGroupTasks[targetIndex] = { ...updatedGroupTasks[targetIndex], status: targetStatus };
      updatedGroupedTasks = { ...updatedGroupedTasks, [targetStatus]: updatedGroupTasks };

      setGroupedTasks(updatedGroupedTasks);
      setDragTarget({ index: targetIndex, status: targetStatus });
    },
    [draggedTask, groupedTasks, setDragTarget, index, task.status, setGroupedTasks]
  );

  const handleDragEnd = useCallback(() => {
    if (!draggedTask || !dragTarget) return;

    const sourceStatus = draggedTask.task.status;
    const sourceIndex = draggedTask.index;
    const targetStatus = dragTarget.status;
    const targetIndex = dragTarget.index ?? groupedTasks[targetStatus].length - 1;

    if (dragCompleted === false) {
      const updatedGroupedTasks = { ...groupedTasks };
      // Revert the optimistic update
      if (sourceStatus !== targetStatus) {
        // Remove from target
        updatedGroupedTasks[targetStatus].splice(targetIndex, 1);
        // Re-insert into source
        updatedGroupedTasks[sourceStatus].splice(sourceIndex, 0, draggedTask.task);
        updatedGroupedTasks[sourceStatus][sourceIndex].status = sourceStatus;
      } else {
        updatedGroupedTasks[sourceStatus].splice(targetIndex, 1);
        updatedGroupedTasks[sourceStatus].splice(sourceIndex, 0, draggedTask.task);
      }

      setGroupedTasks(updatedGroupedTasks);
    } else if (dragCompleted === true) {
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
    }

    setDraggedTask(null);
    setDragTarget(null);
    setDragCompleted(undefined);
  }, [
    draggedTask,
    dragTarget,
    groupedTasks,
    dragCompleted,
    customTaskSequences,
    setDraggedTask,
    setDragTarget,
    setDragCompleted,
    setGroupedTasks,
    setCustomTaskSequences,
  ]);

  const editTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      setTaskFormData({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigneeId: task.assigneeId,
        tags: task.tags,
        dueDate: task.dueDate,
        status: task.status,
      });

      setModalMode("edit");
    },
    [tasks, setModalMode, setTaskFormData]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (window.confirm("Are you sure you want to delete this task?")) {
        try {
          await taskApi.delete(taskId);
          setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        } catch (err) {
          console.error("Error deleting task:", err);
          setError(err instanceof Error ? err.message : "Failed to delete task");
        }
      }
    },
    [setTasks, setError]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: draggable div for task card
    <div
      key={task.id}
      className={`${styles.taskCard} ${styles[`priority-${task.priority}`]} ${overdue ? styles.overdue : ""}`}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      role="button"
      tabIndex={0}
    >
      <div className={styles.taskHeader}>
        <button
          type="button"
          title="Edit task"
          className={styles.editButton}
          onClick={() => editTask(task.id)}
          aria-label="Edit task"
        >
          <FaRegEdit />
        </button>
        <h3 className={styles.taskTitle}>{task.title}</h3>
        <button
          type="button"
          title="Delete task"
          className={styles.deleteButton}
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
        >
          <TiDeleteOutline size={21} />
        </button>
      </div>
      <p className={styles.taskDescription}>{task.description}</p>
      <div className={styles.taskTags}>
        {task.tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className={styles.taskFooter}>
        <div className={styles.assignee}>
          {user && (
            <>
              <img src={user.avatar} alt={user.name} className={styles.avatar} />
              <span>{user.name}</span>
            </>
          )}
        </div>
        <div className={styles.dueDate}>{formatDate(task.dueDate)}</div>
      </div>
    </div>
  );
};
