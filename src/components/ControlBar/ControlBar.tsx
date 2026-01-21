import { useEffect, useState } from "react";
import { IoCloseCircle } from "react-icons/io5";
import { LuBookmark } from "react-icons/lu";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { useTaskFilterContext } from "../../contexts/TaskManagerFilterContext";
import { useDebounce } from "../../hooks/useDebounce";
import { FilterTags } from "../FilterTags/FilterTags";
import styles from "./ControlBar.module.css";

export const ControlBar = () => {
  const { setModalMode, setSearchQuery } = useTaskManagerContext();
  const { appliedFilters, setShowBookmarkedOnly, setAppliedFilters } = useTaskFilterContext();
  const { searchBy, showBookmarkedOnly } = appliedFilters;
  const [query, setQuery] = useState("");
  const debouncedValue = useDebounce(query, 300);

  useEffect(() => {
    setSearchQuery(debouncedValue);
  }, [debouncedValue, setSearchQuery]);

  const searchByText = searchBy === "all" ? "title, description, or tags" : searchBy;

  const toggleBookmarkFilter = () => {
    const newValue = !showBookmarkedOnly;
    setShowBookmarkedOnly(newValue);
    setAppliedFilters((prev) => ({ ...prev, showBookmarkedOnly: newValue }));
  };

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
        <button
          type="button"
          className={`${styles.bookmarkButton} ${showBookmarkedOnly ? styles.active : ""}`}
          onClick={toggleBookmarkFilter}
          aria-label="Toggle bookmarked tasks filter"
          title={showBookmarkedOnly ? "Show all tasks" : "Show bookmarked tasks only"}
        >
          <LuBookmark />
        </button>
        <button type="button" className={styles.sortButton} onClick={() => setModalMode("filter")}>
          Search & Filter Options
        </button>
        <button type="button" className={styles.sortButton} onClick={() => setModalMode("sort")}>
          Sort Options
        </button>
      </div>
      <FilterTags />
    </div>
  );
  // });
};
