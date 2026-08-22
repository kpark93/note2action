// Declares every URL path in the app and which view renders there. main.tsx
// mounts <App> inside <AppProviders>; App owns routing only — it fetches
// nothing and renders no providers of its own.
// Path §1 [hop 1/15]: main.tsx → providers.tsx → [this file] → views/*
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
 * /sign-in and /sign-up are public; every other route is nested under
 * <RequireAuth><AppLayout /></RequireAuth>, so it needs a signed-in Clerk
 * session first (components/app/require-auth.tsx).
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
