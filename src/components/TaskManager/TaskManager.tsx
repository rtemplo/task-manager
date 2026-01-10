import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { FilterPanel } from "../FilterPanel/FilterPanel";
import { SortModal } from "../SortModal/SortModal";
import { Stats } from "../Stats/Stats";
import { TaskBoard } from "../TaskBoard/TaskBoard";
import { TaskManagerHeader } from "../TaskManagerHeader/TaskManagerHeader";
import { TaskModal } from "../TaskModal/TaskModal";
import styles from "./TaskManager.module.css";

const TaskManager: React.FC = () => {
  const { loading, error, modalMode, setError } = useTaskManagerContext();

  return (
    <div className={styles.container}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}>Loading...</div>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {modalMode && modalMode !== "sort" && <TaskModal />}
      {modalMode === "sort" && <SortModal />}

      <TaskManagerHeader />
      <FilterPanel />
      <TaskBoard />
      <Stats />
    </div>
  );
};

export { TaskManager };
