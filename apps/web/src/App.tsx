import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./features/actionItems/components/ActionItemsApp";
import { HomeView } from "./features/actionItems/components/HomeView";
import { CaptureView } from "./features/actionItems/components/CaptureView";
import { ReviewView } from "./features/actionItems/components/ReviewView";
import { TasksView } from "./features/actionItems/components/TasksView";
import { HistoryView } from "./features/actionItems/components/HistoryView";

/**
 * Root-level router. `main.tsx` supplies the providers (React Query, StrictMode);
 * App owns routing. The layout route renders the sidebar + <Outlet/>, and each
 * child route is a view.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomeView />} />
          <Route path="capture" element={<CaptureView />} />
          <Route path="review" element={<ReviewView />} />
          <Route path="tasks" element={<TasksView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
