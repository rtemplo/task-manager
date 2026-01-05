import { useCallback } from "react";
import { FaRegEdit } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import { taskApi } from "../../api/taskApi";
import type { Task } from "../../common/types";
import { useTaskForm } from "../../contexts/TaskFormContext";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const { users, tasks, draggedTaskId, setModalMode, setTasks, setError, setDraggedTaskId, saveCustomSort } =
    useTaskManagerContext();
  const { setTaskFormData } = useTaskForm();

  const user = users.find((user) => user.id === task.assigneeId);
  const overdue = task.dueDate < new Date().toISOString() && task.status !== "done";

  const handleDragStart = useCallback(() => {
    setDraggedTaskId(task.id);
  }, [task.id, setDraggedTaskId]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedTaskId) return;

      // Find the dragged task to get its current status
      const draggedTask = tasks.find((t) => t.id === draggedTaskId);
      if (!draggedTask) return;

      const sourceStatus = draggedTask.status;
      const targetStatus = task.status;
      const targetIndex = index;

      // If dragging within the same column
      if (sourceStatus === targetStatus) {
        const statusTasks = tasks.filter((t) => t.status === sourceStatus);
        const sourceIndex = statusTasks.findIndex((t) => t.id === draggedTaskId);

        if (sourceIndex === targetIndex) return;

        // Reorder tasks within the same column
        setTasks((prevTasks) => {
          const columnTasks = prevTasks.filter((t) => t.status === sourceStatus);
          const draggedItem = columnTasks[sourceIndex];

          const reorderedColumnTasks = [...columnTasks];
          reorderedColumnTasks.splice(sourceIndex, 1);
          reorderedColumnTasks.splice(targetIndex, 0, draggedItem);

          const otherTasks = prevTasks.filter((t) => t.status !== sourceStatus);
          return [...otherTasks, ...reorderedColumnTasks];
        });
      } else {
        // Moving to a different column - update status and insert at drop position
        const updateTaskStatus = async () => {
          try {
            const updatedTask = await taskApi.updateStatus(draggedTaskId, targetStatus);
            setTasks((prevTasks) => {
              // Remove the dragged task from all tasks
              const tasksWithoutDragged = prevTasks.filter((t) => t.id !== draggedTaskId);

              // Get tasks in the target column
              const targetColumnTasks = tasksWithoutDragged.filter((t) => t.status === targetStatus);

              // Insert the updated task at the drop position
              targetColumnTasks.splice(targetIndex, 0, updatedTask);

              // Merge with tasks from other columns
              const otherColumnTasks = tasksWithoutDragged.filter((t) => t.status !== targetStatus);
              return [...otherColumnTasks, ...targetColumnTasks];
            });
          } catch (err) {
            console.error("Error updating task status:", err);
            setError(err instanceof Error ? err.message : "Failed to update task");
          }
        };
        updateTaskStatus();
      }
    },
    [draggedTaskId, tasks, task.status, index, setTasks, setError]
  );

  const handleDragEnd = useCallback(() => {
    // Save custom sort for the affected column(s)
    if (draggedTaskId) {
      const draggedTask = tasks.find((t) => t.id === draggedTaskId);
      if (draggedTask) {
        const statusTasks = tasks.filter((t) => t.status === draggedTask.status);
        const taskIds = statusTasks.map((t) => t.id);
        saveCustomSort(draggedTask.status, taskIds);
      }
    }
    setDraggedTaskId(null);
  }, [draggedTaskId, tasks, saveCustomSort, setDraggedTaskId]);

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
      onDragStart={handleDragStart}
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
