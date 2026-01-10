import { useCallback, useEffect, useState } from "react";
import { appStateApi } from "../../api/taskApi";
import type { SortField, SortOption, TaskStatus } from "../../common/types";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import { RiCloseCircleLine } from "react-icons/ri"
import styles from "./SortModal.module.css";

export const SortModal: React.FC = () => {
  const { setModalMode, appState, setAppState, customTaskSequences, setCustomTaskSequences } =
    useTaskManagerContext();
  const [draggedSortIndex, setDraggedSortIndex] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<TaskStatus[]>(["todo", "in-progress", "done"]);

  // Sort state
  const [sortOptions, setSortOptions] = useState<SortOption[]>([
    { field: "dueDate", direction: "ascending" },
  ]);
  const [availableSortFields, setAvailableSortFields] = useState<SortField[]>(["priority", "assignee"]);
  const [selectedAvailableFields, setSelectedAvailableFields] = useState<SortField[]>([]);
  const [selectedSortOptions, setSelectedSortOptions] = useState<number[]>([]);

  // Sort modal handlers
  const handleAddSortFields = useCallback(() => {
    const newSortOptions: SortOption[] = selectedAvailableFields.map((field) => ({
      field,
      direction: "ascending" as const,
    }));

    setSortOptions((prev) => [...prev, ...newSortOptions]);
    setAvailableSortFields((prev) => prev.filter((f) => !selectedAvailableFields.includes(f)));
    setSelectedAvailableFields([]);
  }, [selectedAvailableFields]);

  const handleRemoveSortFields = useCallback(() => {
    const fieldsToRemove = selectedSortOptions.map((idx) => sortOptions[idx].field);
    setSortOptions((prev) => prev.filter((_, idx) => !selectedSortOptions.includes(idx)));
    setAvailableSortFields((prev) => [...prev, ...fieldsToRemove]);
    setSelectedSortOptions([]);
  }, [selectedSortOptions, sortOptions]);

  const handleSortDirectionChange = useCallback((index: number, direction: "ascending" | "descending") => {
    setSortOptions((prev) => prev.map((opt, idx) => (idx === index ? { ...opt, direction } : opt)));
  }, []);

  const handleSortDragStart = useCallback((index: number) => {
    setDraggedSortIndex(index);
  }, []);

  const handleSortDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedSortIndex === null || draggedSortIndex === index) return;

      setSortOptions((prev) => {
        const newOptions = [...prev];
        const draggedItem = newOptions[draggedSortIndex];
        newOptions.splice(draggedSortIndex, 1);
        newOptions.splice(index, 0, draggedItem);
        return newOptions;
      });
      setDraggedSortIndex(index);
    },
    [draggedSortIndex]
  );

  const handleSortDragEnd = useCallback(() => {
    setDraggedSortIndex(null);
  }, []);

  const handleAvailableFieldClick = useCallback(
    (field: SortField, e: React.MouseEvent | React.KeyboardEvent) => {
      if (e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") return;

      const isMultiSelect = "ctrlKey" in e && (e.ctrlKey || e.metaKey);
      if (isMultiSelect) {
        setSelectedAvailableFields((prev) =>
          prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
        );
      } else {
        setSelectedAvailableFields([field]);
      }
    },
    []
  );

  const handleSortOptionClick = useCallback((index: number, e: React.MouseEvent | React.KeyboardEvent) => {
    if (e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") return;

    const isMultiSelect = "ctrlKey" in e && (e.ctrlKey || e.metaKey);
    if (isMultiSelect) {
      setSelectedSortOptions((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setSelectedSortOptions([index]);
    }
  }, []);

  const closeSortModal = useCallback(() => {
    setSelectedAvailableFields([]);
    setSelectedSortOptions([]);
    setModalMode(null);
  }, [setModalMode]);

  // Load sort configuration from appState on mount only
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only load initial config on mount, not when columns change
  useEffect(() => {
    if (!appState) return;

    const { columnSortConfigs } = appState.tasks.sort;
    const firstColumn = selectedColumns[0] || "todo";

    // Load sort options for the first selected column
    const columnConfig = columnSortConfigs[firstColumn];
    if (columnConfig && columnConfig.length > 0) {
      setSortOptions(columnConfig);

      // Update available fields based on what's already in use
      const usedFields = columnConfig.map((opt) => opt.field);
      const allFields: SortField[] = ["dueDate", "priority", "assignee"];
      setAvailableSortFields(allFields.filter((f) => !usedFields.includes(f)));
    } else {
      // Default configuration
      setSortOptions([{ field: "dueDate", direction: "ascending" }]);
      setAvailableSortFields(["priority", "assignee"]);
    }
  }, [appState]);

  // Save sort configuration to appState
  const saveSortConfig = useCallback(async () => {
    if (!appState) return;

    try {
      const USER_ID = "default-user"; // TODO: Replace with actual user auth

      // Build column configs
      // - Selected columns get the current sortOptions
      // - Unselected columns preserve their existing configuration
      const columnSortConfigs = { ...appState.tasks.sort.columnSortConfigs };

      for (const column of selectedColumns) {
        columnSortConfigs[column] = sortOptions;
      }

      // Save sort configuration
      await appStateApi.updateSortConfig(USER_ID, { columnSortConfigs });

      // Clear custom sequences for selected columns
      const updatedSequences = { ...customTaskSequences };
      for (const column of selectedColumns) {
        updatedSequences[column] = {
          useSequence: false,
          sequence: [],
        };
      }
      setCustomTaskSequences(updatedSequences);

      // Fetch the complete updated appState
      const updatedAppState = await appStateApi.get(USER_ID);
      setAppState(updatedAppState);
      closeSortModal();
    } catch (err) {
      console.error("Error saving sort config:", err);
    }
  }, [
    appState,
    selectedColumns,
    sortOptions,
    setAppState,
    closeSortModal,
    setCustomTaskSequences,
    customTaskSequences,
  ]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSortModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeSortModal]);

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: div required for modal backdrop overlay */}
      <div className="modalBackdrop" role="button" tabIndex={0} aria-label="Close modal" />
      <div className={`modal ${styles.sortModal}`}>
        <div className="header">
          <span className="title">Set Sort Options</span>
          <button
            type="button"
            title="close"
            aria-label="Close sort options modal"
            className="closeIconBtn"
            onClick={closeSortModal}
          >
            <RiCloseCircleLine size={28}/>
          </button>
        </div>
        <div className={styles.sortControls}>
          <div className={styles.columnCheckboxes}>
            <span className={styles.columnCheckboxLabel}>Apply to:</span>
            <label className={styles.columnCheckbox}>
              <input
                type="checkbox"
                checked={selectedColumns.includes("todo")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, "todo"]);
                  } else {
                    setSelectedColumns(selectedColumns.filter((c) => c !== "todo"));
                  }
                }}
              />
              To Do
            </label>
            <label className={styles.columnCheckbox}>
              <input
                type="checkbox"
                checked={selectedColumns.includes("in-progress")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, "in-progress"]);
                  } else {
                    setSelectedColumns(selectedColumns.filter((c) => c !== "in-progress"));
                  }
                }}
              />
              In Progress
            </label>
            <label className={styles.columnCheckbox}>
              <input
                type="checkbox"
                checked={selectedColumns.includes("done")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, "done"]);
                  } else {
                    setSelectedColumns(selectedColumns.filter((c) => c !== "done"));
                  }
                }}
              />
              Done
            </label>
          </div>
        </div>
        <div className={styles.sortContent}>
          <div className={styles.sortColumn}>
            <h3 className={styles.sortColumnTitle}>Available Fields</h3>
            <div className={styles.sortFieldList}>
              {availableSortFields.map((field) => (
                // biome-ignore lint/a11y/useSemanticElements: div required for custom styling and behavior
                <div
                  key={field}
                  className={`${styles.sortField} ${selectedAvailableFields.includes(field) ? styles.selected : ""}`}
                  onClick={(e) => handleAvailableFieldClick(field, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => handleAvailableFieldClick(field, e)}
                >
                  {field === "dueDate" ? "Due Date" : field === "priority" ? "Priority" : "Assignee"}
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.addFieldsBtn}
              disabled={selectedAvailableFields.length === 0}
              onClick={handleAddSortFields}
            >
              Add Selected →
            </button>
          </div>

          <div className={styles.sortColumn}>
            <h3 className={styles.sortColumnTitle}>Sort Order</h3>
            <div className={styles.sortOptionList}>
              {sortOptions.map((option, index) => (
                // biome-ignore lint/a11y/useSemanticElements: div required for draggable functionality and custom styling
                <div
                  key={`${option.field}-${index}`}
                  className={`${styles.sortOptionItem} ${selectedSortOptions.includes(index) ? styles.selected : ""}`}
                  draggable
                  onDragStart={() => handleSortDragStart(index)}
                  onDragOver={(e) => handleSortDragOver(e, index)}
                  onDragEnd={handleSortDragEnd}
                  onClick={(e) => handleSortOptionClick(index, e)}
                  onKeyDown={(e) => handleSortOptionClick(index, e)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.sortOptionName}>
                    {option.field === "dueDate"
                      ? "Due Date"
                      : option.field === "priority"
                        ? "Priority"
                        : "Assignee"}
                  </div>
                  <label className={styles.sortRadioLabel}>
                    <input
                      type="radio"
                      name={`sort-${index}`}
                      checked={option.direction === "ascending"}
                      onChange={() => handleSortDirectionChange(index, "ascending")}
                      onClick={(e) => e.stopPropagation()}
                    />
                    Asc
                  </label>
                  <label className={styles.sortRadioLabel}>
                    <input
                      type="radio"
                      name={`sort-${index}`}
                      checked={option.direction === "descending"}
                      onChange={() => handleSortDirectionChange(index, "descending")}
                      onClick={(e) => e.stopPropagation()}
                    />
                    Desc
                  </label>
                </div>
              ))}
            </div>
            {selectedSortOptions.length > 0 && (
              <button type="button" className={styles.removeFieldsBtn} onClick={handleRemoveSortFields}>
                Remove Selected
              </button>
            )}
          </div>
        </div>
        <div className="footer">
          <button type="button" className={`${styles.actionBtn} ${styles.saveBtn}`} onClick={saveSortConfig}>
            Apply
          </button>
        </div>
      </div>
    </>
  );
};
