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

  const handleDragEnd = () => {
    console.log("Drag ended at TaskManager level");
  };

  const handleDragDrop = () => {
    console.log("Drag dropped at TaskManager level");
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Static Elements should not be interactive.
    <div className={styles.container} onDragEnd={handleDragEnd} onDrop={handleDragDrop}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading...</p>
          </div>
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
