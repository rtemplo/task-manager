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

  const loaderMode = loading ? "visible" : "hidden";
  const taskModalMode = modalMode === "add" || modalMode === "edit" ? "visible" : "hidden";
  const sortModalMode = modalMode === "sort" ? "visible" : "hidden";
  const filterModalMode = modalMode === "filter" ? "visible" : "hidden";
  const errorAlertMode = error ? "visible" : "hidden";

  return (
    <div className={styles.container}>
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
