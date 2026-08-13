import { useActionItems } from "../store";
import { Sidebar } from "./Sidebar";
import { CaptureView } from "./CaptureView";
import { ReviewView } from "./ReviewView";
import { TasksView } from "./TasksView";
import { HistoryView } from "./HistoryView";
import { RecentModal } from "./RecentModal";

export function ActionItemsApp() {
  const screen = useActionItems((s) => s.screen);

  return (
    <div className="flex h-screen gap-[14px] overflow-hidden bg-[#0a1030] p-[14px]">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-[#38499b] px-6 py-[22px]">
        {screen === "capture" && <CaptureView />}
        {screen === "review" && <ReviewView />}
        {screen === "tasks" && <TasksView />}
        {screen === "history" && <HistoryView />}
      </main>
      <RecentModal />
    </div>
  );
}
