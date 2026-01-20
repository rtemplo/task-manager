import { useCallback, useEffect, useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { FaEllipsis } from "react-icons/fa6";
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
    setModalMode,
    setTasks,
    setGroupedTasks,
    setError,
    setDraggedTask,
    setDragTarget,
  } = useTaskManagerContext();
  const { setTaskFormData } = useTaskForm();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = users.find((user) => user.id === task.assigneeId);
  const overdue = task.dueDate < new Date().toISOString() && task.status !== "done";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

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

      const sourceId = draggedTask.task.id;
      const targetId = task.id;
      const targetStatus = task.status;
      const targetIndex = index;

      if (sourceId === targetId) return;

      let updatedGroupedTasks = { ...groupedTasks };

      // Remove from all columns to prevent duplication
      for (const status of ["todo", "in-progress", "done"] as TaskStatus[]) {
        updatedGroupedTasks[status] = updatedGroupedTasks[status].filter((t) => t.id !== draggedTask.task.id);
      }

      const updatedGroupTasks = [...updatedGroupedTasks[targetStatus]];

      updatedGroupTasks.splice(targetIndex, 0, draggedTask.task);
      updatedGroupTasks[targetIndex] = { ...updatedGroupTasks[targetIndex], status: targetStatus };
      updatedGroupedTasks = { ...updatedGroupedTasks, [targetStatus]: updatedGroupTasks };

      setGroupedTasks(updatedGroupedTasks);
      setDragTarget({ index: targetIndex, status: targetStatus });
    },
    [draggedTask, groupedTasks, setDragTarget, index, task.status, setGroupedTasks, task.id]
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
      setIsMenuOpen(false);
    },
    [tasks, setModalMode, setTaskFormData]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (window.confirm("Are you sure you want to delete this task?")) {
        try {
          await taskApi.delete(taskId);
          setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
          setIsMenuOpen(false);
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
      role="button"
      tabIndex={0}
    >
      <div className={styles.taskHeader}>
        <h3 className={styles.taskTitle}>{task.title}</h3>
        <div className={styles.menuContainer} ref={menuRef}>
          <button
            type="button"
            title="More options"
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-label="More options"
          >
            <FaEllipsis />
          </button>
          {isMenuOpen && (
            <div className={styles.dropdownMenu}>
              <button type="button" className={styles.menuItem} onClick={() => editTask(task.id)}>
                <FaRegEdit />
                <span>Edit</span>
              </button>
              <button type="button" className={styles.menuItem} onClick={() => deleteTask(task.id)}>
                <TiDeleteOutline size={18} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
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
