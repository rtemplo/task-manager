import { IoClose } from "react-icons/io5";
import { useTaskFilterContext } from "../../contexts/TaskManagerFilterContext";
import styles from "./FilterTags.module.css";

export const FilterTags = () => {
  const { appliedFilters, resetField } = useTaskFilterContext();

  return (
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
              <button
                type="button"
                className={styles.removeButton}
                aria-label={`Remove ${key} filter`}
                title="Remove filter"
                onClick={() => resetField(key as keyof typeof appliedFilters)}
              >
                <IoClose />
              </button>
            </span>
          );
        })}
    </div>
  );
};
