import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import styles from "./TaskManagerHeader.module.css";

export const TaskManagerHeader: React.FC = () => {
  const { setModalMode } = useTaskManagerContext();

  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Task Manager</h1>
      <div className={styles.headerActions}>
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
