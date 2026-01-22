import { Activity } from "react";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { ControlBar } from "../ControlBar/ControlBar";
import { ErrorAlert } from "../ErrorAlert/ErrorAlert";
import { FilterModal } from "../FilterModal/FilterModal";
import { Loader } from "../Loader/Loader";
import { SortModal } from "../SortModal/SortModal";
import { StatsBar } from "../StatsBar/StatsBar";
import { TaskBoard } from "../TaskBoard/TaskBoard";
import { TaskManagerHeader } from "../TaskManagerHeader/TaskManagerHeader";
import { TaskModal } from "../TaskModal/TaskModal";
import styles from "./TaskManager.module.css";

const TaskManager: React.FC = () => {
  const { loading, error, modalMode, setError } = useTaskManagerContext();

  const handleDragEnd = () => {
    console.log("Drag ended at TaskManager level");
  };

  const handleDragDrop = () => {
    console.log("Drag dropped at TaskManager level");
  };

  const loaderMode = loading ? "visible" : "hidden";
  const taskModalMode = modalMode === "add" || modalMode === "edit" ? "visible" : "hidden";
  const sortModalMode = modalMode === "sort" ? "visible" : "hidden";
  const filterModalMode = modalMode === "filter" ? "visible" : "hidden";
  const errorAlertMode = error ? "visible" : "hidden";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Static Elements should not be interactive.
    <div className={styles.container} onDragEnd={handleDragEnd} onDrop={handleDragDrop}>
      <Activity mode={loaderMode}>
        <Loader />
      </Activity>
      <Activity mode={errorAlertMode}>
        <ErrorAlert message={error} closeErrorMessage={() => setError(null)} />
      </Activity>
      <Activity mode={taskModalMode}>
        <TaskModal />
      </Activity>
      <Activity mode={sortModalMode}>
        <SortModal />
      </Activity>
      <Activity mode={filterModalMode}>
        <FilterModal />
      </Activity>

      <TaskManagerHeader />
      <ControlBar />
      <TaskBoard />
      <StatsBar />
    </div>
  );
};

export { TaskManager };
