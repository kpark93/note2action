import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { RecentModal } from "./recent-modal";

/**
 * App shell: fixed sidebar + the routed view in <Outlet/>. Rendered as the
 * layout route in App.tsx. The transcript dialog lives here so it can open from
 * any route (its open state is in the shared store).
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
