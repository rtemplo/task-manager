import { useCallback, useEffect, useMemo, useState } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { RiAddCircleLine, RiCloseCircleLine, RiResetLeftLine } from "react-icons/ri";
import type { TaskPriority } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { useTaskFilterContext } from "../../contexts/TaskManagerFilterContext";
import styles from "./FilterModal.module.css";

export const FilterModal: React.FC = () => {
  const { users, setModalMode } = useTaskManagerContext();
  const {
    filterState,
    filterState: { searchBy, assigneeIds, priorities, dueDateRange },
    setSearchBy,
    setAssigneeIds,
    setPriorities,
    setDueDateRange,
    setAppliedFilters,
    resetFilters,
  } = useTaskFilterContext();
  const [userSearchText, setUserSearchText] = useState("");
  const [dateError, setDateError] = useState("");

  const closeFilterModal = useCallback(() => {
    setModalMode(null);
  }, [setModalMode]);

  const handlePriorityChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { value, checked } = e.target;
    let updatedPriorities = [...priorities];
    if (checked) {
      updatedPriorities.push(value as TaskPriority);
    } else {
      updatedPriorities = updatedPriorities.filter((p) => p !== value);
    }
    setPriorities(updatedPriorities);
  };

  const handleUserAdd: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const userId = e.currentTarget.getAttribute("data-user-id");
    if (!userId) return;
    if (!assigneeIds.includes(userId)) {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  const handleUserRemove: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const userId = e.currentTarget.getAttribute("data-user-id");
    if (!userId) return;
    setAssigneeIds(assigneeIds.filter((id) => id !== userId));
  };

  useEffect(() => {
    if (!dueDateRange) return;
    if (dueDateRange.from && dueDateRange.to && dueDateRange.from > dueDateRange.to) {
      setDateError('"From" date cannot be later than the "To" date');
    } else {
      setDateError("");
    }
  }, [dueDateRange]);

  const renderErrorIcon = (errorMessage?: string) => {
    if (!errorMessage?.trim()) return null;
    return <FaExclamationCircle title={errorMessage} className={styles.errorIcon} />;
  };

  const handleResetFilters = useCallback(() => {
    setDateError("");
    setUserSearchText("");
    resetFilters();
  }, [resetFilters]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filterState);
    closeFilterModal();
  }, [filterState, setAppliedFilters, closeFilterModal]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFilterModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeFilterModal]);

  const availableUsers = useMemo(() => {
    return users.filter(
      (user) =>
        !assigneeIds.includes(user.id) &&
        (!userSearchText || user.name.toLowerCase().includes(userSearchText.toLowerCase()))
    );
  }, [users, assigneeIds, userSearchText]);

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: div required for modal backdrop overlay */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Enforce to have the onClick mouse event with the onKeyUp, the onKeyDown, or the onKeyPress keyboard event. */}
      <div
        className="modalBackdrop"
        role="button"
        tabIndex={0}
        aria-label="Filter tasks modal backdrop"
        onClick={closeFilterModal}
      />
      <form className={`modal ${styles.filterModal}`} noValidate>
        <div className="header">
          <span className="title">Filter Options</span>
          <button
            type="button"
            title="close filter options modal"
            aria-label="Close filter options modal window"
            className="closeIconBtn"
            onClick={closeFilterModal}
          >
            <RiCloseCircleLine size={28} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <fieldset className={styles.modalFieldsetGroup}>
            <legend className={styles.columnCheckboxLabel}>Search By:</legend>
            <div className={styles.columnCheckboxes}>
              <label
                className={styles.columnCheckbox}
                title="all"
                aria-label="search by title, description, or tags"
              >
                <input
                  name="searchBy"
                  type="radio"
                  checked={searchBy === "all"}
                  onChange={() => setSearchBy("all")}
                />
                All
              </label>
              <label className={styles.columnCheckbox} title="title" aria-label="search by title">
                <input
                  name="searchBy"
                  type="radio"
                  checked={searchBy === "title"}
                  onChange={() => setSearchBy("title")}
                />
                Title
              </label>
              <label className={styles.columnCheckbox} title="description" aria-label="search by description">
                <input
                  name="searchBy"
                  type="radio"
                  checked={searchBy === "description"}
                  onChange={() => setSearchBy("description")}
                />
                Description
              </label>
              <label className={styles.columnCheckbox} title="tags" aria-label="search by tags">
                <input
                  name="searchBy"
                  type="radio"
                  checked={searchBy === "tags"}
                  onChange={() => setSearchBy("tags")}
                />
                Tags
              </label>
            </div>
          </fieldset>
          <fieldset className={styles.modalFieldsetGroup}>
            <legend className={styles.columnCheckboxLabel}>Priorities:</legend>
            <div className={styles.columnCheckboxes}>
              <label className={styles.columnCheckbox} title="low priority" aria-label="low priority">
                <input
                  name="priority"
                  type="checkbox"
                  checked={priorities.includes("low")}
                  value="low"
                  onChange={handlePriorityChange}
                />
                Low
              </label>
              <label className={styles.columnCheckbox} title="medium priority" aria-label="medium priority">
                <input
                  name="priority"
                  type="checkbox"
                  checked={priorities.includes("medium")}
                  value="medium"
                  onChange={handlePriorityChange}
                />
                Medium
              </label>
              <label className={styles.columnCheckbox} title="high priority" aria-label="high priority">
                <input
                  name="priority"
                  type="checkbox"
                  checked={priorities.includes("high")}
                  value="high"
                  onChange={handlePriorityChange}
                />
                High
              </label>
            </div>
          </fieldset>
          <div className={styles.userSelection}>
            <div className={styles.userSelectionColumn}>
              <h3 className={styles.userSelectionColumnTitle}>Available Assignees:</h3>
              <input
                type="text"
                className={`${styles.inputBox} ${styles.userSearchInput}`}
                placeholder="Search users..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.currentTarget.value)}
              />
              <div className={styles.availableUsersList}>
                {availableUsers.map((user) => (
                  <div className={styles.userListItem} key={user.id}>
                    <span className={styles.userListText}>{user.name}</span>
                    <button
                      type="button"
                      title={`Assign ${user.name}`}
                      aria-label={`Assign ${user.name} to filter`}
                      className={`${styles.userListButton} ${styles.userListButtonAdd}`}
                      data-user-id={user.id}
                      onClick={handleUserAdd}
                    >
                      <RiAddCircleLine size={21} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.userSelectionColumn}>
              <div className={styles.titleWrapper}>
                <h3 className={styles.userSelectionColumnTitle}>Selected Assignees:</h3>
                <button
                  type="button"
                  title="Remove All Users"
                  aria-label="Remove all users from filter"
                  className={`${styles.userListButton} ${styles.deleteButtonRemove}`}
                  onClick={() => setAssigneeIds([])}
                >
                  <RiResetLeftLine size={21} />
                </button>
              </div>
              <div className={styles.selectedUsersList}>
                {assigneeIds.map((userId) => {
                  const user = users.find((u) => u.id === userId);
                  if (!user) return null;
                  return (
                    <div key={user.id} className={styles.userListItem}>
                      <span className={styles.userListText}>{user.name}</span>
                      <button
                        type="button"
                        title={`Remove ${user.name}`}
                        aria-label={`Remove ${user.name} from filter`}
                        className={`${styles.userListButton} ${styles.deleteButtonRemove}`}
                        data-user-id={user.id}
                        onClick={handleUserRemove}
                      >
                        <RiCloseCircleLine size={21} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <fieldset className={styles.modalFieldsetGroup}>
            <legend className={styles.dateRangeLabel}>Due Date Range:</legend>
            <div className={styles.dateRangeGroup}>
              <label htmlFor="fromDate" className={styles.datePickerGroup}>
                From:
                <input
                  id="fromDate"
                  type="date"
                  title="From date"
                  aria-label="From date"
                  className={styles.inputBox}
                  value={dueDateRange?.from || ""}
                  onChange={(e) => {
                    setDueDateRange({
                      from: e.target.value,
                      to: dueDateRange?.to,
                    });
                  }}
                />
              </label>
              <label htmlFor="toDate" className={styles.datePickerGroup}>
                To:
                <input
                  id="toDate"
                  type="date"
                  className={styles.inputBox}
                  title="To date"
                  aria-label="To date"
                  value={dueDateRange?.to || ""}
                  onChange={(e) => {
                    setDueDateRange({
                      from: dueDateRange?.from,
                      to: e.target.value,
                    });
                  }}
                />
              </label>
              {renderErrorIcon(dateError)}
            </div>
          </fieldset>
        </div>

        <div className="footer">
          <button
            type="button"
            title="Close filter options modal"
            aria-label="Close filter options modal window"
            className="actionBtn cancelBtn"
            onClick={closeFilterModal}
          >
            Close
          </button>
          <button
            type="button"
            title="Reset Filters"
            aria-label="Reset all filter options to default"
            className="actionBtn"
            onClick={handleResetFilters}
          >
            Reset
          </button>
          <button
            type="button"
            title="Apply filter options"
            aria-label="Apply filter options"
            className="actionBtn saveBtn"
            onClick={handleApplyFilters}
            disabled={Boolean(dateError)}
          >
            Apply
          </button>
        </div>
      </form>
    </>
  );
};
