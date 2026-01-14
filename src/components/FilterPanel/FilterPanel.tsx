import { useCallback, useEffect, useState } from "react";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { useTaskFilterContext } from "../../contexts/TaskManagerFilterContext";
import { useDebounce } from "../../hooks/useDebounce";
import styles from "./FilterPanel.module.css";

export const FilterPanel: React.FC = () => {
  const { setModalMode, applyFilters } = useTaskManagerContext();
  const { filterState, setFilterQuery } = useTaskFilterContext();
  const { searchBy } = filterState;
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
      <div className={styles.filterControls}>
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
      <div className={styles.filterTags}>
        {Object.keys(filterState)
          .filter((key) => {
            if (key === "query" && !filterState.query) return false;
            if (key === "searchBy" && filterState.searchBy === "all") return false;
            if (key === "assigneeIds" && filterState.assigneeIds.length === 0) return false;
            if (key === "priorities" && filterState.priorities.length === 0) return false;
            if (key === "dueDateRange" && !filterState.dueDateRange) return false;
            return true;
          })
          .map((key) => {
            let displayValue = "";
            if (key === "query") displayValue = `Search: "${filterState.query}"`;
            if (key === "searchBy") displayValue = `Search By: ${filterState.searchBy}`;
            if (key === "assigneeIds") displayValue = `Assignees: ${filterState.assigneeIds.length}`;
            if (key === "priorities") displayValue = `Priorities: ${filterState.priorities.length}`;
            if (key === "dueDateRange") {
              const range = filterState.dueDateRange;
              displayValue = `Due Date: ${range?.from ?? "Any"} - ${range?.to ?? "Any"}`;
            }

            return (
              <span key={key} className={styles.filterTag}>
                {displayValue}
              </span>
            );
          })}
      </div>
    </div>
  );
};
