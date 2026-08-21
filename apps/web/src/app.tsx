import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/app/app-layout";
import { RequireAuth } from "@/components/app/require-auth";
import { SignInView } from "@/views/auth/sign-in.view";
import { SignUpView } from "@/views/auth/sign-up.view";
import { HomeView } from "@/views/home/home.view";
import { CaptureView } from "@/views/capture/capture.view";
import { ReviewView } from "@/views/review/review.view";
import { TasksView } from "@/views/tasks/tasks.view";
import { HistoryView } from "@/views/history/history.view";
import { MeetingsView } from "@/views/meetings/meetings.view";

/**
 * Root-level router. `main.tsx` supplies the providers (Clerk, React Query,
 * StrictMode); App owns routing. /sign-in and /sign-up are public; everything
 * under the layout route requires a signed-in Clerk session (<RequireAuth>).
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="sign-in" element={<SignInView />} />
        <Route path="sign-up" element={<SignUpView />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<HomeView />} />
          <Route path="capture" element={<CaptureView />} />
          <Route path="review" element={<ReviewView />} />
          <Route path="tasks" element={<TasksView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="meetings" element={<MeetingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
