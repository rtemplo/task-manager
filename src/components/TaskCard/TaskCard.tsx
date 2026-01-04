import { useCallback } from "react";
import { FaRegEdit } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import { taskApi } from "../../api/taskApi";
import type { Task } from "../../common/types";
import { useTaskForm } from "../../contexts/TaskFormContext";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import styles from "./TaskCard.module.css";

export const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const { users, tasks, setDraggedTaskId, setModalMode, setTasks, setError } = useTaskManagerContext();
  const { setTaskFormData } = useTaskForm();

  const user = users.find((user) => user.id === task.assigneeId);
  const overdue = task.dueDate < new Date().toISOString() && task.status !== "done";

  const handleDragStart = useCallback(
    (taskId: string) => {
      setDraggedTaskId(taskId);
    },
    [setDraggedTaskId]
  );

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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: draggable div for task card
    <div
      key={task.id}
      className={`${styles.taskCard} ${styles[`priority-${task.priority}`]} ${overdue ? styles.overdue : ""}`}
      draggable
      onDragStart={() => handleDragStart(task.id)}
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
