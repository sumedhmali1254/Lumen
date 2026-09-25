import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { HistoryProvider } from "./context/HistoryContext.jsx";
import { BackendProvider } from "./context/BackendContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <BackendProvider>
        <HistoryProvider>
          <App />
        </HistoryProvider>
      </BackendProvider>
    </BrowserRouter>
  </StrictMode>,
);
