// App shell: the chrome wrapped around every authenticated screen.
// Rendered by app.tsx as the layout route, inside <RequireAuth>; renders
// Sidebar and the active view through <Outlet/>.
// Path: app.tsx (layout route) → [this file] → Sidebar, <Outlet/> (views/*).
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { RecentModal } from "./recent-modal";

/**
 * Fixed sidebar + the routed view in <Outlet/>. The transcript dialog
 * (RecentModal) lives here, not in a view, so it can open from any route —
 * it reads its own open/closed state from the extraction store, not props.
 */
export function AppLayout() {
  return (
    <div className="flex h-screen gap-[14px] overflow-hidden bg-background p-[14px]">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-panel px-6 py-[22px]">
        <Outlet />
      </main>
      <RecentModal />
    </div>
  );
}
