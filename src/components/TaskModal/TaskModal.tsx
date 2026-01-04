import { useCallback, useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { taskApi } from "../../api/taskApi";
import { useTaskForm } from "../../contexts/TaskFormContext";
import { useTaskManagerContext } from "../../contexts/TaskManagerContext";
import styles from "./TaskModal.module.css";

export const TaskModal: React.FC = () => {
  const {
    taskFormData,
    formValidationStatus,
    titleRef,
    descriptionRef,
    dueDateRef,
    updateFormData,
    resetFormData,
    formIsValid,
  } = useTaskForm();

  const { users, modalMode, setTasks, setError, setModalMode } = useTaskManagerContext();

  const closeAddNewTaskModal = useCallback(() => {
    resetFormData();
    setModalMode(null);
  }, [resetFormData, setModalMode]);

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

  const renderErrorIcon = (errorMessage?: string) => {
    if (!errorMessage?.trim()) return null;
    return <FaExclamationCircle title={errorMessage} className="errorIcon" />;
  };

  const saveTask = useCallback(async () => {
    if (!modalMode || modalMode === "sort") return;
    if (!formIsValid()) return;

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
  }, [taskFormData, modalMode, formIsValid, closeAddNewTaskModal, setTasks, setError]);

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: div required for modal backdrop overlay */}
      <div className="modalBackdrop" role="button" tabIndex={0} aria-label="Close modal" />
      <form className={`modal ${styles.newTaskModal}`} noValidate>
        <div className="header">
          <span className="title">{modalMode === "add" ? "Create New Task" : "Edit Task"}</span>
          <button
            type="button"
            title="close"
            aria-label="Close add new task modal window"
            className="closeIconBtn"
            onClick={closeAddNewTaskModal}
          >
            ×
          </button>
        </div>
        {Object.entries(formValidationStatus).length > 0 && (
          <div className="errorMessage">Please review the errors below.</div>
        )}
        <div className="content">
          <div className="form">
            <label htmlFor="title" className="controlLabel">
              Title
              {renderErrorIcon(formValidationStatus.title)}
            </label>
            <input
              id="title"
              type="text"
              className={`control ${formValidationStatus.title ? "error" : ""}`}
              value={taskFormData.title}
              onChange={updateFormData}
              ref={titleRef}
            />

            <label htmlFor="description" className="controlLabel">
              Description
              {renderErrorIcon(formValidationStatus.description)}
            </label>
            <textarea
              id="description"
              className={`control ${formValidationStatus.description ? "error" : ""}`}
              value={taskFormData.description}
              style={{ resize: "none" }}
              onChange={updateFormData}
              ref={descriptionRef}
            />

            <label htmlFor="priority" className="controlLabel">
              Priority
            </label>
            <select
              id="priority"
              className="control"
              style={{ width: "120px" }}
              value={taskFormData.priority}
              onChange={updateFormData}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <label htmlFor="assigneeId" className="controlLabel">
              Assignee
            </label>
            <div className="selectWrapper">
              <select
                id="assigneeId"
                className="control"
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

            <label htmlFor="tags" className="controlLabel">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              className="control"
              value={taskFormData.tags.join(", ")}
              onChange={updateFormData}
            />

            <label htmlFor="dueDate" className="controlLabel">
              Due Date
              {renderErrorIcon(formValidationStatus.dueDate)}
            </label>
            <input
              id="dueDate"
              type="date"
              className={`control ${formValidationStatus.dueDate ? "error" : ""}`}
              style={{ width: "120px" }}
              value={taskFormData.dueDate ? new Date(taskFormData.dueDate).toISOString().split("T")[0] : ""}
              onChange={updateFormData}
              ref={dueDateRef}
            />

            <label htmlFor="status" className="controlLabel">
              Status
            </label>
            <select
              id="status"
              className="control"
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
        <div className="footer">
          <button
            type="button"
            className="actionBtn cancelBtn"
            onClick={closeAddNewTaskModal}
            aria-label="Close add new task modal window"
          >
            Close
          </button>
          <button type="button" className="actionBtn saveBtn" onClick={saveTask}>
            {modalMode === "add" ? "Create Task" : "Edit Task"}
          </button>
        </div>
      </form>
    </>
  );
};
