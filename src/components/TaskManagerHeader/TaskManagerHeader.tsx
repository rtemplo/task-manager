import { useRef, useState } from "react";
import { RiResetLeftFill } from "react-icons/ri";
import { seedApi } from "../../api/taskApi";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { DeleteConfirmPopover } from "../DeleteConfirmPopover/DeleteConfirmPopover";
import styles from "./TaskManagerHeader.module.css";

export const TaskManagerHeader: React.FC = () => {
  const { setModalMode, setError } = useTaskManagerContext();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetButtonRef = useRef<HTMLButtonElement>(null);

  const handleResetDemo = async () => {
    setIsResetting(true);
    setShowResetConfirm(false);
    try {
      await seedApi.resetDemo();

      // Clear all localStorage data (custom sequences)
      localStorage.removeItem("task-manager-custom-sequences");

      // Reload the page to fetch fresh data
      window.location.reload();
    } catch (err) {
      console.error("Error resetting demo:", err);
      setError(err instanceof Error ? err.message : "Failed to reset demo data");
      setIsResetting(false);
    }
  };

  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Task Manager</h1>
      <div className={styles.headerActions}>
        <button
          ref={resetButtonRef}
          type="button"
          className={styles.resetButton}
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          title="Reset demo data"
          aria-label="Reset demo data"
        >
          <RiResetLeftFill size={20} />
        </button>
        {showResetConfirm && (
          <DeleteConfirmPopover
            anchorEl={resetButtonRef.current}
            onConfirm={handleResetDemo}
            onCancel={() => setShowResetConfirm(false)}
            message="This will reset all demo data back to its original state. Are you sure?"
          />
        )}
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            setModalMode("add");
          }}
        >
          + New Task
        </button>
      </div>
    </div>
  );
};
