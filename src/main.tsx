import { createRoot } from "react-dom/client";
import { TaskManager } from "./components/TaskManager/TaskManager";
import { TaskFormProvider } from "./contexts/TaskFormContext";
import { TaskManagerProvider } from "./contexts/TaskManagerContext";

import "./style.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    // <StrictMode>
    //   <BrowserRouter>
    //     <App />
    //   </BrowserRouter>
    // </StrictMode>
    <TaskManagerProvider>
      <TaskFormProvider>
        <TaskManager />
      </TaskFormProvider>
    </TaskManagerProvider>
  );
}
