import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import styles from "./StatsBar.module.css";

export const StatsBar: React.FC = () => {
  const { groupedTasks } = useTaskManagerContext();

  const totalTasks = groupedTasks.todo.length + groupedTasks["in-progress"].length + groupedTasks.done.length;

  return (
    <div className={styles.statsBar}>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Total Tasks</span>
        <span className={styles.statValue}>{totalTasks}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>In Progress</span>
        <span className={styles.statValue}>{groupedTasks["in-progress"].length}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Completed</span>
        <span className={styles.statValue}>{groupedTasks.done.length}</span>
      </div>
    </div>
  );
};
