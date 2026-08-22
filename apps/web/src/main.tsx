// App entry point: mounts the React tree into index.html's #root div.
// Wraps everything in <AppProviders> (Clerk auth, TanStack Query) and then
// <App> (the router) — see providers.tsx and app.tsx for what each adds.
// Path: index.html → [this file] → providers.tsx → app.tsx → views/*.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { AppProviders } from "./providers";
import "./global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
