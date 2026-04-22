import { createRoot } from "react-dom/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "./lib/supabase";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <SessionContextProvider supabaseClient={supabase}>
    <App />
  </SessionContextProvider>,
);
