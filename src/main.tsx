import { createRoot } from "react-dom/client";
import { TaskManager } from "./components/TaskManager/TaskManager";
import { TaskFormProvider } from "./contexts/TaskFormContext";
import { TaskManagerProvider } from "./contexts/TaskManagerContext";

import "./style.css";
import { StrictMode } from "react";
import { TaskFilterProvider } from "./contexts/TaskManagerFilterContext";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <TaskFilterProvider>
        <TaskManagerProvider>
          <TaskFormProvider>
            <TaskManager />
          </TaskFormProvider>
        </TaskManagerProvider>
      </TaskFilterProvider>
    </StrictMode>
  );
}
