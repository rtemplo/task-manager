import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import styles from "./Stats.module.css";

export const Stats: React.FC = () => {
  const { filteredTasks, tasksByStatus } = useTaskManagerContext();

  return (
    <div className={styles.stats}>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Total Tasks</span>
        <span className={styles.statValue}>{filteredTasks.length}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>In Progress</span>
        <span className={styles.statValue}>{tasksByStatus["in-progress"].length}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Completed</span>
        <span className={styles.statValue}>{tasksByStatus.done.length}</span>
      </div>
    </div>
  );
};
