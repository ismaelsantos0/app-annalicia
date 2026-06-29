import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminDashboard from "./imports/admin";
import "./styles/index.css";
import "./imports/styles.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AdminDashboard />
    </QueryClientProvider>
  </StrictMode>
);