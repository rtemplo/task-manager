import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import styles from "./FilterPanel.module.css";

export const FilterPanel: React.FC = () => {
  const { users, setModalMode } = useTaskManagerContext();

  return (
    <div className={styles.filterPanel}>
      <input type="text" className={styles.searchInput} placeholder="Search tasks..." />
      <div className={styles.selectWrapper}>
        <select className={styles.filterSelect}>
          <option value="">Filter by Assignee</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className={styles.sortButton} onClick={() => setModalMode("sort")}>
        Set Sort Options
      </button>
      <button type="button" className={styles.clearFiltersButton}>
        Clear Filters
      </button>
    </div>
  );
};
