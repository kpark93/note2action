import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { HomeView } from "@/views/Home/home.view";
import { CaptureView } from "@/views/Capture/capture.view";
import { ReviewView } from "@/views/Review/review.view";
import { TasksView } from "@/views/Tasks/tasks.view";
import { HistoryView } from "@/views/History/history.view";

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
