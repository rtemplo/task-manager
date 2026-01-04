import React, {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { TaskFormData } from "../common/types";

interface ITaskFormContext {
  taskFormData: TaskFormData;
  formValidationStatus: Partial<Record<keyof TaskFormData, string>>;
  titleRef: React.RefObject<HTMLInputElement | null> | null;
  descriptionRef: React.RefObject<HTMLTextAreaElement | null> | null;
  dueDateRef: React.RefObject<HTMLInputElement | null> | null;
  setTaskFormData: Dispatch<SetStateAction<TaskFormData>>;
  updateFormData: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  resetFormData: () => void;
  formIsValid: () => boolean;
}

const initFormData: TaskFormData = {
  title: "",
  description: "",
  priority: "low",
  assigneeId: "",
  tags: [],
  dueDate: "",
  status: "todo",
};

const TaskFormContext = createContext<ITaskFormContext>({
  taskFormData: initFormData,
  formValidationStatus: {},
  titleRef: null,
  descriptionRef: null,
  dueDateRef: null,
  setTaskFormData: () => {},
  updateFormData: () => {},
  resetFormData: () => {},
  formIsValid: () => false,
});

export const TaskFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(initFormData);
  const [formValidationStatus, setFormValidationStatus] = useState<
    Partial<Record<keyof TaskFormData, string>>
  >({});

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);

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

  const resetFormData = useCallback(() => {
    setFormValidationStatus({});
    setTaskFormData(initFormData);
  }, []);

  const formIsValid = useCallback(() => {
    let isValid = true;
    let focused = false;
    setFormValidationStatus({});

    if (taskFormData.title.trim().length < 3) {
      setFormValidationStatus((prev) => ({ ...prev, title: "Title must be at least 3 characters long." }));
      if (!focused) {
        titleRef?.current?.focus();
        focused = true;
      }
    }

    if (taskFormData.description.trim().length < 5) {
      setFormValidationStatus((prev) => ({
        ...prev,
        description: "Description must be at least 5 characters long.",
      }));
      if (!focused) {
        descriptionRef?.current?.focus();
        focused = true;
      }
    }

    if (!taskFormData.dueDate || new Date(taskFormData.dueDate) < new Date()) {
      setFormValidationStatus((prev) => ({ ...prev, dueDate: "A due date in the future is required." }));
      if (!focused) {
        dueDateRef?.current?.focus();
        focused = true;
      }
    }

    isValid = !focused;

    return isValid;
  }, [taskFormData]);

  return (
    <TaskFormContext.Provider
      value={{
        taskFormData,
        formValidationStatus,
        titleRef,
        descriptionRef,
        dueDateRef,
        setTaskFormData,
        updateFormData,
        resetFormData,
        formIsValid,
      }}
    >
      {children}
    </TaskFormContext.Provider>
  );
};

export const useTaskForm = () => {
  const context = useContext(TaskFormContext);
  if (!context) {
    throw new Error("useTaskForm must be used within a TaskFormProvider");
  }
  return context;
};
