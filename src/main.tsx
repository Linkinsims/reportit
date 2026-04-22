import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
