/** App shell: the chrome around every authenticated screen, inside <RequireAuth>. */
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";

/** Fixed sidebar + the routed view in <Outlet/>. */
export function AppLayout() {
  return (
    <div className="flex h-screen gap-[14px] overflow-hidden bg-background p-[14px]">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-panel px-6 py-[22px]">
        <Outlet />
      </main>
    </div>
  );
}
