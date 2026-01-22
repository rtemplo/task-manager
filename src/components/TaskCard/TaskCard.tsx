import { useCallback, useEffect, useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { FaEllipsis } from "react-icons/fa6";
import { LuBookmarkCheck, LuBookmarkMinus, LuBookmarkPlus } from "react-icons/lu";
import { TiDeleteOutline } from "react-icons/ti";
import { appStateApi, taskApi } from "../../api/taskApi";
import type { Task } from "../../common/types";
import { useTaskForm } from "../../contexts/TaskFormContext";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { DeleteConfirmPopover } from "../DeleteConfirmPopover/DeleteConfirmPopover";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const { users, tasks, appState, setModalMode, setTasks, setAppState, setError } = useTaskManagerContext();
  const { setTaskFormData } = useTaskForm();
  const { handleCardDragStart, handleCardDragOver } = useDragAndDrop({
    task,
    index,
    status: task.status,
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const user = users.find((user) => user.id === task.assigneeId);
  const overdue = task.dueDate < new Date().toISOString() && task.status !== "done";
  const isBookmarked = appState?.tasks.bookmarks.includes(task.id) ?? false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowDeleteConfirm(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  // Close confirm dialog when menu closes
  useEffect(() => {
    if (!isMenuOpen) {
      setShowDeleteConfirm(false);
    }
  }, [isMenuOpen]);

  useEscapeKey(() => {
    setIsMenuOpen(false);
    setShowDeleteConfirm(false);
  }, isMenuOpen);

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
      try {
        await taskApi.delete(taskId);
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        setIsMenuOpen(false);
        setShowDeleteConfirm(false);
      } catch (err) {
        console.error("Error deleting task:", err);
        setError(err instanceof Error ? err.message : "Failed to delete task");
      }
    },
    [setTasks, setError]
  );

  const toggleBookmark = useCallback(async () => {
    if (!appState) return;

    try {
      const updatedAppState = isBookmarked
        ? await appStateApi.removeBookmark(appState.userId, task.id)
        : await appStateApi.addBookmark(appState.userId, task.id);
      setAppState(updatedAppState);
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      setError(err instanceof Error ? err.message : "Failed to update bookmark");
    }
  }, [appState, isBookmarked, task.id, setAppState, setError]);

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
      onDragStart={() => handleCardDragStart(index)}
      onDragOver={handleCardDragOver}
      role="button"
      tabIndex={0}
    >
      <div className={styles.taskHeader}>
        <h3 className={styles.taskTitle}>{task.title}</h3>
        <div className={styles.headerActions}>
          {isBookmarked && (
            <div className={styles.bookmarkIndicator} title="Bookmarked">
              <LuBookmarkCheck />
            </div>
          )}
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
                <button type="button" className={styles.menuItem} onClick={toggleBookmark}>
                  {isBookmarked ? <LuBookmarkMinus /> : <LuBookmarkPlus />}
                  <span>{isBookmarked ? "Remove Bookmark" : "Add Bookmark"}</span>
                </button>
                <button
                  ref={deleteButtonRef}
                  type="button"
                  className={styles.menuItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                >
                  <TiDeleteOutline size={18} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showDeleteConfirm && (
        <DeleteConfirmPopover
          anchorEl={deleteButtonRef.current}
          onConfirm={() => deleteTask(task.id)}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
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
