import { createRoot } from "react-dom/client";
import { TaskManager } from "./components/TaskManager/TaskManager";

import "./style.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    // <StrictMode>
    //   <BrowserRouter>
    //     <App />
    //   </BrowserRouter>
    // </StrictMode>
    <TaskManager />
  );
}
