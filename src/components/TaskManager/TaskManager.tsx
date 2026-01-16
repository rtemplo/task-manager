import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { ControlBar } from "../ControlBar/ControlBar";
import { FilterModal } from "../FilterModal/FilterModal";
import { SortModal } from "../SortModal/SortModal";
import { StatsBar } from "../StatsBar/StatsBar";
import { TaskBoard } from "../TaskBoard/TaskBoard";
import { TaskManagerHeader } from "../TaskManagerHeader/TaskManagerHeader";
import { TaskModal } from "../TaskModal/TaskModal";
import styles from "./TaskManager.module.css";

const TaskManager: React.FC = () => {
  const { loading, error, modalMode, setError } = useTaskManagerContext();
  // const controlBarRef = useRef<ControlBarRef>(null);

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

      {(modalMode === "add" || modalMode === "edit") && <TaskModal />}
      {modalMode === "sort" && <SortModal />}
      {modalMode === "filter" && <FilterModal />}

      <TaskManagerHeader />
      <ControlBar />
      <TaskBoard />
      <StatsBar />
    </div>
  );
};

export { TaskManager };
