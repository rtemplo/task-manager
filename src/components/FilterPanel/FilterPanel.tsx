import { useCallback, useEffect, useState } from "react";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { useTaskFilterContext } from "../../contexts/TaskManagerFilterContext";
import { useDebounce } from "../../hooks/useDebounce";
import styles from "./FilterPanel.module.css";

export const FilterPanel: React.FC = () => {
  const { setModalMode, applyFilters } = useTaskManagerContext();
  const {
    filterState: { searchBy },
    setFilterQuery,
  } = useTaskFilterContext();
  const [query, setQuery] = useState("");
  const debouncedValue = useDebounce(query, 300);

  useEffect(() => {
    setFilterQuery(debouncedValue);
  }, [debouncedValue, setFilterQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        applyFilters();
      }
    },
    [applyFilters]
  );

  const searchByText = searchBy === "all" ? "title, description, or tags" : searchBy;

  return (
    <div className={styles.filterPanel}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={`Type ${searchByText} then press Enter to search tasks...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="button" className={styles.sortButton} onClick={() => setModalMode("filter")}>
        Search & Filter Options
      </button>
      <button type="button" className={styles.sortButton} onClick={() => setModalMode("sort")}>
        Sort Options
      </button>
    </div>
  );
};
