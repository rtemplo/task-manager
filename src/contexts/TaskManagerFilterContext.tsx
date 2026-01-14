import { createContext, useCallback, useContext, useReducer } from "react";
import type { FilterAction, FilterState, TaskPriority } from "../common/types";

const filterStateReducer = (state: FilterState, action: FilterAction) => {
  switch (action.type) {
    case "SET_SEARCH_BY":
      return { ...state, searchBy: action.payload.searchBy };
    case "SET_ASSIGNEE_IDS":
      return { ...state, assigneeIds: action.payload.assigneeIds };
    case "SET_PRIORITIES":
      return { ...state, priorities: action.payload.priorities };
    case "SET_DUE_DATE_RANGE":
      return { ...state, dueDateRange: action.payload.dueDateRange };
    case "SET_QUERY":
      return { ...state, query: action.payload.query };
    case "RESET_FILTERS":
      return {
        query: "",
        searchBy: "all" as const,
        assigneeIds: [],
        priorities: [],
        dueDateRange: null,
      };
    default:
      return state;
  }
};

interface ITaskFilterContext {
  filterState: FilterState;
  setSearchBy: (searchBy: FilterState["searchBy"]) => void;
  setAssigneeIds: (ids: string[]) => void;
  setPriorities: (priorities: FilterState["priorities"]) => void;
  setDueDateRange: (dueDateRange: FilterState["dueDateRange"]) => void;
  setFilterQuery: (query: string) => void;
  resetFilters: () => void;
}

const TaskFilterContext = createContext<ITaskFilterContext>({
  filterState: {
    query: "",
    searchBy: "all",
    assigneeIds: [],
    priorities: [],
    dueDateRange: null,
  },
  setSearchBy: () => {},
  setAssigneeIds: () => {},
  setPriorities: () => {},
  setDueDateRange: () => {},
  setFilterQuery: () => {},
  resetFilters: () => {},
});

export const TaskFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filterState, dispatch] = useReducer(filterStateReducer, {
    query: "",
    searchBy: "all",
    assigneeIds: [],
    priorities: [],
    dueDateRange: null,
  });

  const setSearchBy = useCallback((searchBy: FilterState["searchBy"]) => {
    dispatch({ type: "SET_SEARCH_BY", payload: { searchBy } });
  }, []);

  const setAssigneeIds = useCallback((ids: string[]) => {
    dispatch({ type: "SET_ASSIGNEE_IDS", payload: { assigneeIds: ids } });
  }, []);

  const setPriorities = useCallback((priorities: TaskPriority[]) => {
    dispatch({ type: "SET_PRIORITIES", payload: { priorities } });
  }, []);

  const setDueDateRange = useCallback((dueDateRange: FilterState["dueDateRange"]) => {
    dispatch({ type: "SET_DUE_DATE_RANGE", payload: { dueDateRange } });
  }, []);

  const setFilterQuery = useCallback((query: string) => {
    dispatch({ type: "SET_QUERY", payload: { query } });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, []);

  return (
    <TaskFilterContext.Provider
      value={{
        filterState,
        setSearchBy,
        setAssigneeIds,
        setPriorities,
        setDueDateRange,
        setFilterQuery,
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
