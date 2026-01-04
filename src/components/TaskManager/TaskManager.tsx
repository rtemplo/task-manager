import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { FilterPanel } from "../FilterPanel/FilterPanel";
import { SortModal } from "../SortModal/SortModal";
import { Stats } from "../Stats/Stats";
import { TaskBoard } from "../TaskBoard/TaskBoard";
import { TaskManagerHeader } from "../TaskManagerHeader/TaskManagerHeader";
import { TaskModal } from "../TaskModal/TaskModal";
import styles from "./TaskManager.module.css";

/**
 * Task Manager Challenge
 *
 * TODO: Implement the following features:
 *
 * 1. TASK DISPLAY
 *    + Show tasks in three columns: "To Do", "In Progress", "Done"
 *    + Display task cards with all information
 *    + Visual indicators for overdue tasks and priority
 *
 * 2. TASK MANAGEMENT
 *    + Create new tasks (modal or inline form)
 *    + Edit existing tasks
 *    + Delete tasks with confirmation
 *    + Mark tasks as complete/incomplete
 *
 * 3. DRAG AND DROP
 *    - Implement drag-and-drop between columns
 *    - Update task status on drop
 *    - Add visual feedback during drag
 *
 * 4. FILTERS AND SEARCH
 *    - Search by title/description
 *    - Filter by assignee, priority, tags, due date
 *    - Clear filters functionality
 *
 * 5. REAL-TIME SIMULATION
 *    - Simulate another user making changes
 *    - Show notifications for changes
 *    - Handle optimistic updates
 *    - Visual indicators for recently updated tasks
 *
 * TIPS:
 * - Use useReducer for complex task state management
 * - Implement proper TypeScript types for all functions
 * - Use useMemo for filtering and sorting
 * - Handle edge cases (empty states, validation)
 * - Consider accessibility (keyboard navigation, ARIA labels)
 * - Implement proper error handling
 */

const TaskManager: React.FC = () => {
  const { loading, users, error, modalMode, setError, setModalMode } = useTaskManagerContext();

  // TODO: Real-time collaboration simulation
  // Implement simulation logic here

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
