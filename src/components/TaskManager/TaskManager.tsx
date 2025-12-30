import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaExclamationCircle, FaRegEdit } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import { taskApi, userApi } from "../../api/taskApi";
import type { SortField, SortOption, Task, TaskFormData, TaskStatus, User } from "../../common/types";
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
  const initFormData: TaskFormData = {
    title: "",
    description: "",
    priority: "low",
    assigneeId: "",
    tags: [],
    dueDate: "",
    status: "todo",
  };

  // TODO: State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "sort" | null>(null);
  const [formValidationStatus, setFormValidationStatus] = useState<
    Partial<Record<keyof TaskFormData, string>>
  >({});
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(initFormData);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Sort state
  const [sortOptions, setSortOptions] = useState<SortOption[]>([
    { field: "dueDate", direction: "ascending" },
  ]);
  const [availableSortFields, setAvailableSortFields] = useState<SortField[]>(["priority", "assignee"]);
  const [selectedAvailableFields, setSelectedAvailableFields] = useState<SortField[]>([]);
  const [selectedSortOptions, setSelectedSortOptions] = useState<number[]>([]);
  const [draggedSortIndex, setDraggedSortIndex] = useState<number | null>(null);

  const titleRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const dueDateRef = useRef<HTMLInputElement | null>(null);

  // const DELAY = 300;
  // const _title = useDebounce(taskFormData.title, DELAY);
  // const _description = useDebounce(taskFormData.description, DELAY);
  // const _priority = useDebounce(taskFormData.priority, DELAY);
  // const _assigneeId = useDebounce(taskFormData.assigneeId, DELAY);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tasksData, usersData] = await Promise.all([taskApi.getAll(), userApi.getAll()]);
        setTasks(tasksData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updateFormData = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setTaskFormData((prevData) => ({
      ...prevData,
      [id]:
        id === "tags"
          ? value
              ?.trim()
              .split(",")
              .map((tag) => tag.trim())
          : value,
    }));
  };

  // TODO: Implement filtering logic
  const filteredTasks = useMemo(() => {
    // Implement filter logic here (search, assignee, priority, tags, due date)
    // TODO: Apply sorting based on sortOptions state
    return tasks;
  }, [tasks]);

  // TODO: Group tasks by status
  const tasksByStatus = useMemo(() => {
    return {
      todo: filteredTasks.filter((task) => task.status === "todo"),
      "in-progress": filteredTasks.filter((task) => task.status === "in-progress"),
      done: filteredTasks.filter((task) => task.status === "done"),
    };
  }, [filteredTasks]);

  // TODO: Implement drag and drop handlers
  const handleDragStart = useCallback((taskId: string) => {
    setDraggedTaskId(taskId);
  }, []);

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add(styles.dropZoneActive);
  }, []);

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dropZoneActive);
  }, []);

  const handleDrop = useCallback(
    async (status: TaskStatus, e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove(styles.dropZoneActive);

      if (!draggedTaskId) return;

      try {
        const updatedTask = await taskApi.updateStatus(draggedTaskId, status);
        setTasks((prevTasks) => prevTasks.map((task) => (task.id === draggedTaskId ? updatedTask : task)));
      } catch (err) {
        console.error("Error updating task status:", err);
        setError(err instanceof Error ? err.message : "Failed to update task");
      } finally {
        setDraggedTaskId(null);
      }
    },
    [draggedTaskId]
  );

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
  }, []);

  const handleValidate = useCallback(() => {
    if (!modalMode) return false;
    let hasError = false;
    let focused = false;

    if (taskFormData.title.trim().length < 3) {
      setFormValidationStatus((prev) => ({ ...prev, title: "Title must be at least 3 characters long." }));
      if (!focused) {
        titleRef.current?.focus();
        focused = true;
      }
      hasError = true;
    }

    if (taskFormData.description.trim().length < 5) {
      setFormValidationStatus((prev) => ({
        ...prev,
        description: "Description must be at least 5 characters long.",
      }));
      if (!focused) {
        descriptionRef.current?.focus();
        focused = true;
      }
      hasError = true;
    }

    if (!taskFormData.dueDate || new Date(taskFormData.dueDate) < new Date()) {
      setFormValidationStatus((prev) => ({ ...prev, dueDate: "A due date in the future is required." }));
      if (!focused) {
        dueDateRef.current?.focus();
        focused = true;
      }
      hasError = true;
    }

    if (!hasError) {
      setFormValidationStatus({});
    }

    return !hasError;
  }, [taskFormData, modalMode]);

  // TODO: Task CRUD operations
  const resetFormData = useCallback(() => {
    setFormValidationStatus({});
    setTaskFormData(initFormData);
  }, []);

  const closeAddNewTaskModal = useCallback(() => {
    resetFormData();
    setModalMode(null);
  }, [resetFormData]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!modalMode) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAddNewTaskModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modalMode, closeAddNewTaskModal]);

  const saveTask = useCallback(async () => {
    const formIsValid = modalMode ? handleValidate() : false;
    if (!formIsValid) return;

    try {
      if (modalMode === "add" && !taskFormData.id) {
        const newTask = await taskApi.create(taskFormData);
        setTasks((prevTasks) => [...prevTasks, newTask]);
      }

      if (modalMode === "edit" && taskFormData.id) {
        const updatedTask = await taskApi.update(taskFormData.id, taskFormData);
        setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskFormData.id ? updatedTask : t)));
      }

      closeAddNewTaskModal();
    } catch (err) {
      console.error("Error saving task:", err);
      setError(err instanceof Error ? err.message : "Failed to save task");
    }
  }, [handleValidate, taskFormData, modalMode, closeAddNewTaskModal]);

  const editTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      setTaskFormData({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigneeId: task.assigneeId,
        tags: task.tags,
        dueDate: task.dueDate,
        status: task.status,
      });

      setModalMode("edit");
    },
    [tasks]
  );

  const deleteTask = useCallback(async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await taskApi.delete(taskId);
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      } catch (err) {
        console.error("Error deleting task:", err);
        setError(err instanceof Error ? err.message : "Failed to delete task");
      }
    }
  }, []);

  // TODO: Real-time collaboration simulation
  // Implement simulation logic here

  // TODO: Utility functions
  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // TODO: Render task card
  const renderTaskCard = (task: Task) => {
    const user = getUserById(task.assigneeId);
    const overdue = task.dueDate < new Date().toISOString() && task.status !== "done";
    return (
      // biome-ignore lint/a11y/useSemanticElements: draggable div for task card
      <div
        key={task.id}
        className={`${styles.taskCard} ${styles[`priority-${task.priority}`]} ${overdue ? styles.overdue : ""}`}
        draggable
        onDragStart={() => handleDragStart(task.id)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.taskHeader}>
          <button
            type="button"
            title="Edit task"
            className={styles.editButton}
            onClick={() => editTask(task.id)}
            aria-label="Edit task"
          >
            <FaRegEdit />
          </button>
          <h3 className={styles.taskTitle}>{task.title}</h3>
          <button
            type="button"
            title="Delete task"
            className={styles.deleteButton}
            onClick={() => deleteTask(task.id)}
            aria-label="Delete task"
          >
            <TiDeleteOutline size={21} />
          </button>
        </div>
        <p className={styles.taskDescription}>{task.description}</p>
        <div className={styles.taskTags}>
          {task.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className={styles.taskFooter}>
          <div className={styles.assignee}>
            {user && (
              <>
                <img src={user.avatar} alt={user.name} className={styles.avatar} />
                <span>{user.name}</span>
              </>
            )}
          </div>
          <div className={styles.dueDate}>{formatDate(task.dueDate)}</div>
        </div>
      </div>
    );
  };

  // TODO: Render column
  const renderColumn = (status: TaskStatus, title: string) => {
    const columnTasks = tasksByStatus[status];

    return (
      <section
        className={styles.column}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(status, e)}
        aria-label={`${title} column`}
        key={title}
      >
        <div className={styles.columnHeader}>
          <h2 className={styles.columnTitle}>{title}</h2>
          <span className={styles.taskCount}>{columnTasks.length}</span>
        </div>
        <div className={styles.taskList}>
          {columnTasks.length === 0 ? (
            <p className={styles.emptyState}>No tasks</p>
          ) : (
            columnTasks.map(renderTaskCard)
          )}
        </div>
      </section>
    );
  };

  const renderErrorIcon = (errorMessage?: string) => {
    if (!errorMessage?.trim()) return null;
    return <FaExclamationCircle title={errorMessage} className={styles.errorIcon} />;
  };

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

      {modalMode && modalMode !== "sort" && (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: div required for modal backdrop overlay */}
          <div className={styles.modalBackdrop} role="button" tabIndex={0} aria-label="Close modal" />
          <form className={`${styles.modal} ${styles.newTaskModal}`} noValidate>
            <div className={styles.header}>
              <span className={styles.title}>{modalMode === "add" ? "Create New Task" : "Edit Task"}</span>
              <button
                type="button"
                title="close"
                aria-label="Close add new task modal window"
                className={styles.closeIconBtn}
                onClick={closeAddNewTaskModal}
              >
                ×
              </button>
            </div>
            {Object.entries(formValidationStatus).length > 0 && (
              <div className={styles.errorMessage}>Please review the errors below.</div>
            )}
            <div className={styles.content}>
              <div className={styles.form}>
                <label htmlFor="title" className={styles.controlLabel}>
                  Title
                  {renderErrorIcon(formValidationStatus.title)}
                </label>
                <input
                  id="title"
                  type="text"
                  className={`${styles.control} ${formValidationStatus.title ? styles.error : ""}`}
                  value={taskFormData.title}
                  onChange={updateFormData}
                  ref={titleRef}
                />

                <label htmlFor="description" className={styles.controlLabel}>
                  Description
                  {renderErrorIcon(formValidationStatus.description)}
                </label>
                <textarea
                  id="description"
                  className={`${styles.control} ${formValidationStatus.description ? styles.error : ""}`}
                  value={taskFormData.description}
                  style={{ resize: "none" }}
                  onChange={updateFormData}
                  ref={descriptionRef}
                />

                <label htmlFor="priority" className={styles.controlLabel}>
                  Priority
                </label>
                <select
                  id="priority"
                  className={styles.control}
                  style={{ width: "120px" }}
                  value={taskFormData.priority}
                  onChange={updateFormData}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <label htmlFor="assigneeId" className={styles.controlLabel}>
                  Assignee
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    id="assigneeId"
                    className={styles.control}
                    value={taskFormData.assigneeId}
                    onChange={updateFormData}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label htmlFor="tags" className={styles.controlLabel}>
                  Tags
                </label>
                <input
                  id="tags"
                  type="text"
                  className={styles.control}
                  value={taskFormData.tags.join(", ")}
                  onChange={updateFormData}
                />

                <label htmlFor="dueDate" className={styles.controlLabel}>
                  Due Date
                  {renderErrorIcon(formValidationStatus.dueDate)}
                </label>
                <input
                  id="dueDate"
                  type="date"
                  className={`${styles.control} ${formValidationStatus.dueDate ? styles.error : ""}`}
                  style={{ width: "120px" }}
                  value={
                    taskFormData.dueDate ? new Date(taskFormData.dueDate).toISOString().split("T")[0] : ""
                  }
                  onChange={updateFormData}
                  ref={dueDateRef}
                />

                <label htmlFor="status" className={styles.controlLabel}>
                  Status
                </label>
                <select
                  id="status"
                  className={styles.control}
                  style={{ width: "120px" }}
                  value={taskFormData.status}
                  onChange={updateFormData}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress" disabled={modalMode === "add"}>
                    In Progress
                  </option>
                  <option value="done" disabled={modalMode === "add"}>
                    Done
                  </option>
                </select>
              </div>
            </div>
            <div className={styles.footer}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.cancelBtn}`}
                onClick={closeAddNewTaskModal}
                aria-label="Close add new task modal window"
              >
                Close
              </button>
              <button type="button" className={`${styles.actionBtn} ${styles.saveBtn}`} onClick={saveTask}>
                {modalMode === "add" ? "Create Task" : "Edit Task"}
              </button>
            </div>
          </form>
        </>
      )}

      {modalMode === "sort" && (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: div required for modal backdrop overlay */}
          <div className={styles.modalBackdrop} role="button" tabIndex={0} aria-label="Close modal" />
          <div className={`${styles.modal} ${styles.sortModal}`}>
            <div className={styles.header}>
              <span className={styles.title}>Set Sort Options</span>
              <button
                type="button"
                title="close"
                aria-label="Close sort options modal"
                className={styles.closeIconBtn}
                onClick={closeSortModal}
              >
                ×
              </button>
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
            <div className={styles.footer}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.saveBtn}`}
                onClick={closeSortModal}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>Task Manager</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => {
              setModalMode("add");
            }}
          >
            + New Task
          </button>
        </div>
      </div>

      {/* TODO: Implement filter panel */}
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

      {/* Task Board */}
      <div className={styles.board}>
        {renderColumn("todo", "To Do")}
        {renderColumn("in-progress", "In Progress")}
        {renderColumn("done", "Done")}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Tasks</span>
          <span className={styles.statValue}>{filteredTasks.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>In Progress</span>
          <span className={styles.statValue}>{tasksByStatus["in-progress"].length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Completed</span>
          <span className={styles.statValue}>{tasksByStatus.done.length}</span>
        </div>
      </div>
    </div>
  );
};

export { TaskManager };
