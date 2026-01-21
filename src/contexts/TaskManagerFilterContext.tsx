import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useReducer,
  useState,
} from "react";
import type { FilterAction, FilterState, TaskPriority } from "../common/types";

const filterStateReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "SET_SEARCH_BY":
      return { ...state, searchBy: action.payload.searchBy };
    case "SET_ASSIGNEE_IDS":
      return { ...state, assigneeIds: action.payload.assigneeIds };
    case "SET_PRIORITIES":
      return { ...state, priorities: action.payload.priorities };
    case "SET_SHOW_BOOKMARKED_ONLY":
      return { ...state, showBookmarkedOnly: action.payload.showBookmarkedOnly };
    case "SET_DUE_DATE_RANGE":
      return { ...state, dueDateRange: action.payload.dueDateRange };
    case "RESET_FILTER":
      return { ...state, [action.payload.field]: defaultFilterState[action.payload.field] };
    case "RESET_ALL_FILTERS":
      return {
        searchBy: "all" as const,
        assigneeIds: [],
        priorities: [],
        showBookmarkedOnly: false,
        dueDateRange: null,
      };
    default:
      return state;
  }
};

interface ITaskFilterContext {
  filterState: FilterState;
  appliedFilters: FilterState;
  setSearchBy: (searchBy: FilterState["searchBy"]) => void;
  setAssigneeIds: (ids: string[]) => void;
  setPriorities: (priorities: FilterState["priorities"]) => void;
  setShowBookmarkedOnly: (showBookmarkedOnly: FilterState["showBookmarkedOnly"]) => void;
  setDueDateRange: (dueDateRange: FilterState["dueDateRange"]) => void;
  setAppliedFilters: Dispatch<SetStateAction<FilterState>>;
  resetField: (field: keyof FilterState) => void;
  resetFilters: () => void;
}

const defaultFilterState: FilterState = {
  searchBy: "all",
  assigneeIds: [],
  priorities: [],
  showBookmarkedOnly: false,
  dueDateRange: null,
};

const TaskFilterContext = createContext<ITaskFilterContext>({
  filterState: defaultFilterState,
  appliedFilters: defaultFilterState,
  setSearchBy: () => {},
  setAssigneeIds: () => {},
  setPriorities: () => {},
  setShowBookmarkedOnly: () => {},
  setDueDateRange: () => {},
  setAppliedFilters: () => {},
  resetField: () => {},
  resetFilters: () => {},
});

export const TaskFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filterState, dispatch] = useReducer(filterStateReducer, defaultFilterState);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilterState);

  const setSearchBy = useCallback((searchBy: FilterState["searchBy"]) => {
    dispatch({ type: "SET_SEARCH_BY", payload: { searchBy } });
  }, []);

  const setAssigneeIds = useCallback((ids: string[]) => {
    dispatch({ type: "SET_ASSIGNEE_IDS", payload: { assigneeIds: ids } });
  }, []);

  const setPriorities = useCallback((priorities: TaskPriority[]) => {
    dispatch({ type: "SET_PRIORITIES", payload: { priorities } });
  }, []);

  const setShowBookmarkedOnly = useCallback((showBookmarkedOnly: boolean) => {
    dispatch({ type: "SET_SHOW_BOOKMARKED_ONLY", payload: { showBookmarkedOnly } });
  }, []);

  const setDueDateRange = useCallback((dueDateRange: FilterState["dueDateRange"]) => {
    dispatch({ type: "SET_DUE_DATE_RANGE", payload: { dueDateRange } });
  }, []);

  const resetField = useCallback((field: keyof FilterState) => {
    dispatch({ type: "RESET_FILTER", payload: { field } });
    setAppliedFilters((prev) => ({ ...prev, [field]: defaultFilterState[field] }));
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_ALL_FILTERS" });
  }, []);

  return (
    <TaskFilterContext.Provider
      value={{
        filterState,
        appliedFilters,
        setSearchBy,
        setAssigneeIds,
        setPriorities,
        setShowBookmarkedOnly,
        setDueDateRange,
        setAppliedFilters,
        resetField,
        resetFilters,
      }}
    >
      {children}
    </TaskFilterContext.Provider>
  );
};

const useTaskFilterContext = () => {
  const context = useContext(TaskFilterContext);
  if (!context) {
    throw new Error("useTaskFilterContext must be used within a TaskFilterProvider");
  }
  return context;
};

export { TaskFilterContext, useTaskFilterContext };
