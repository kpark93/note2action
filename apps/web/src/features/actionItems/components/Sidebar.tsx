import { useHealth } from "@/features/health/hooks";
import { useActionItems } from "../store";
import { summary } from "../selectors";
import type { Screen } from "../types";

const NAV: { screen: Screen; label: string }[] = [
  { screen: "capture", label: "Capture" },
  { screen: "review", label: "Review" },
  { screen: "tasks", label: "Tasks" },
  { screen: "history", label: "History" },
];

export function Sidebar() {
  const screen = useActionItems((s) => s.screen);
  const goTo = useActionItems((s) => s.goTo);
  const items = useActionItems((s) => s.items);
  const { donePct, doneCount, openCount, flagCount } = summary(items);

  // Live API health, surfaced as a small dot — keeps the TanStack Query
  // health check and the Vite /api proxy wired into the real UI.
  const health = useHealth();
  const healthColor =
    health.status === "success"
      ? "#3ddc97"
      : health.status === "error"
        ? "#e93055"
        : "#f5b544";
  const healthLabel =
    health.status === "success"
      ? "API online"
      : health.status === "error"
        ? "API offline"
        : "Checking API…";

  return (
    <aside className="flex w-[198px] flex-none flex-col overflow-hidden rounded-[20px] bg-[#0a1030] px-4 py-[18px]">
      <div className="mb-[22px] flex items-center gap-[10px]">
        <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] bg-[#4d5fe8] text-[11px] font-extrabold tracking-[-0.02em]">
          n2a
        </span>
        <span className="text-[15px] font-bold tracking-[-0.02em]">
          note2action
        </span>
      </div>

      <div className="mb-3 text-[10.5px] font-semibold tracking-[0.14em] text-[#6d7ab0]">
        WORKSPACE
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ screen: s, label }) => {
          const active = screen === s;
          return (
            <button
              key={s}
              onClick={() => goTo(s)}
              className="flex items-center justify-between rounded-[13px] px-[13px] py-[11px] text-left text-[14px]"
              style={{
                background: active ? "#38499b" : "transparent",
                color: active ? "#ffffff" : "#8b96c8",
                fontWeight: active ? 600 : 500,
              }}
            >
              {label}
              {s === "review" && flagCount > 0 && (
                <span className="rounded-full bg-[#e930c0] px-[7px] py-px text-[11px] font-semibold text-white">
                  {flagCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="min-h-[34px] flex-1" />

      <div className="rounded-[16px] bg-[#111a45] p-[14px]">
        <div className="text-[11.5px] text-[#8b96c8]">Completion this month</div>
        <div className="mt-[7px] text-[24px] font-bold tracking-[-0.03em] tabular-nums">
          {donePct}
        </div>
        <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-white/10">
          <div
            className="n2a-bar h-full rounded-full bg-[#e930c0]"
            style={{ width: donePct }}
          />
        </div>
        <div className="mt-[11px] text-[11.5px] text-[#8b96c8]">
          {doneCount} closed · {openCount} open
        </div>
      </div>

      <div className="mt-[14px] flex items-center gap-[11px] border-t border-white/[0.08] pt-[14px]">
        <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#4d5fe8] text-[12px] font-bold">
          KP
        </span>
        <span className="flex flex-col leading-[1.3]">
          <span className="text-[13px] font-semibold">Kyle Park</span>
          <span className="text-[11px] text-[#7c88b8]">Product</span>
        </span>
        <span
          className="ml-auto h-[7px] w-[7px] flex-none rounded-full"
          style={{ background: healthColor }}
          title={healthLabel}
        />
      </div>
    </aside>
  );
}
