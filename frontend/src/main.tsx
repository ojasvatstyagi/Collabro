import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      {/* React Router 7 made the v6 "future" flags we opted into (startTransition, relative splat paths) the default */}
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  </StrictMode>
);
