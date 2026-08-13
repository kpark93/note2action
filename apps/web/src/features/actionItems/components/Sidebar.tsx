import { useHealth } from "@/features/health/hooks";
import { useTheme } from "@/features/theme/store";
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
  const pct = parseInt(donePct, 10) || 0;
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  // Live API health, surfaced as a small dot — keeps the TanStack Query
  // health check and the Vite /api proxy wired into the real UI.
  const health = useHealth();
  const healthColor =
    health.status === "success"
      ? "hsl(var(--success))"
      : health.status === "error"
        ? "hsl(var(--destructive))"
        : "hsl(var(--warning))";
  const healthLabel =
    health.status === "success"
      ? "API online"
      : health.status === "error"
        ? "API offline"
        : "Checking API…";

  return (
    <aside className="flex w-[198px] flex-none flex-col overflow-hidden rounded-[20px] bg-background px-4 py-[18px]">
      <div className="mb-[22px] flex items-center gap-[10px]">
        <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] bg-primary text-[11px] font-extrabold tracking-[-0.02em] text-primary-foreground">
          n2a
        </span>
        <span className="text-[15px] font-bold tracking-[-0.02em]">
          note2action
        </span>
      </div>

      <div className="mb-3 text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground">
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
                background: active ? "hsl(var(--secondary))" : "transparent",
                color: active
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
                fontWeight: active ? 600 : 500,
              }}
            >
              {label}
              {s === "review" && flagCount > 0 && (
                <span className="rounded-full bg-primary px-[7px] py-px text-[11px] font-semibold text-primary-foreground">
                  {flagCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="min-h-[34px] flex-1" />

      <div className="rounded-[16px] bg-secondary p-[14px]">
        <div className="text-[11.5px] text-muted-foreground">Completion this month</div>
        <div className="mt-[7px] text-[24px] font-bold tracking-[-0.03em] tabular-nums">
          <SlotNumber value={pct} />
        </div>
        <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-muted">
          <div
            className="n2a-bar h-full rounded-full bg-primary"
            style={{ width: donePct }}
          />
        </div>
        <div className="mt-[11px] text-[11.5px] text-muted-foreground">
          {doneCount} closed · {openCount} open
        </div>
      </div>

      <div className="mt-[14px] grid grid-cols-2 gap-1 rounded-[12px] border border-border bg-card p-1">
        {(["light", "dark"] as const).map((mode) => {
          const active = theme === mode;
          return (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              aria-pressed={active}
              className="flex items-center justify-center gap-[6px] rounded-[9px] py-[6px] text-[12px] font-medium"
              style={{
                background: active ? "hsl(var(--secondary))" : "transparent",
                color: active
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              <span aria-hidden="true">{mode === "light" ? "☀" : "☾"}</span>
              {mode === "light" ? "Light" : "Dark"}
            </button>
          );
        })}
      </div>

      <div className="mt-[14px] flex items-center gap-[11px] border-t border-border pt-[14px]">
        <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-primary text-[12px] font-bold text-primary-foreground">
          KP
        </span>
        <span className="flex flex-col leading-[1.3]">
          <span className="text-[13px] font-semibold">Kyle Park</span>
          <span className="text-[11px] text-muted-foreground">Product</span>
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

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Slot-machine percentage. Each digit is a 0–9 reel translated to the current
 * value; the CSS transition rolls through the in-between digits — up when the
 * number grows (a task completed), down when it shrinks (added/uncompleted).
 */
function SlotNumber({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const digits = String(clamped).split("");
  return (
    <span
      className="inline-flex items-center"
      style={{ height: "1em", lineHeight: 1 }}
      aria-label={`${clamped}%`}
    >
      {digits.map((d, i) => (
        // Key from the right so lower places keep their reel across carries.
        <SlotDigit key={digits.length - 1 - i} digit={Number(d)} />
      ))}
      <span
        aria-hidden="true"
        style={{ display: "flex", height: "1em", alignItems: "center" }}
      >
        %
      </span>
    </span>
  );
}

function SlotDigit({ digit }: { digit: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "block", height: "1em", overflow: "hidden" }}
    >
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          transform: `translateY(-${digit}em)`,
          transition: "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {DIGITS.map((n) => (
          <span
            key={n}
            style={{
              display: "flex",
              height: "1em",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}
