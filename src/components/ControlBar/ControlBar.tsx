import { useEffect, useState } from "react";
import { IoCloseCircle } from "react-icons/io5";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { useTaskFilterContext } from "../../contexts/TaskManagerFilterContext";
import { useDebounce } from "../../hooks/useDebounce";
import styles from "./ControlBar.module.css";

export const ControlBar = () => {
  const { setModalMode, setSearchQuery } = useTaskManagerContext();
  const { appliedFilters } = useTaskFilterContext();
  const { searchBy } = appliedFilters;
  const [query, setQuery] = useState("");
  const debouncedValue = useDebounce(query, 300);

  useEffect(() => {
    setSearchQuery(debouncedValue);
  }, [debouncedValue, setSearchQuery]);

  const searchByText = searchBy === "all" ? "title, description, or tags" : searchBy;

  return (
    <div className={styles.controlBar}>
      <div className={styles.filterControls}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={`Search by ${searchByText}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => setQuery("")}
              aria-label="Clear search"
              title="Clear search"
            >
              <IoCloseCircle />
            </button>
          )}
        </div>
        <button type="button" className={styles.sortButton} onClick={() => setModalMode("filter")}>
          Search & Filter Options
        </button>
        <button type="button" className={styles.sortButton} onClick={() => setModalMode("sort")}>
          Sort Options
        </button>
      </div>
      <div className={styles.filterTags}>
        {Object.keys(appliedFilters)
          .filter((key) => {
            if (key === "searchBy" && appliedFilters.searchBy === "all") return false;
            if (key === "assigneeIds" && appliedFilters.assigneeIds.length === 0) return false;
            if (key === "priorities" && appliedFilters.priorities.length === 0) return false;
            if (key === "dueDateRange" && !appliedFilters.dueDateRange) return false;
            return true;
          })
          .map((key) => {
            let displayValue = "";
            if (key === "searchBy") displayValue = `Search By: ${appliedFilters.searchBy}`;
            if (key === "assigneeIds") displayValue = `Assignees: ${appliedFilters.assigneeIds.length}`;
            if (key === "priorities") displayValue = `Priorities: ${appliedFilters.priorities.length}`;
            if (key === "dueDateRange") {
              const range = appliedFilters.dueDateRange;
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
  // });
};
