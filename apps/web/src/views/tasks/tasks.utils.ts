import type { ActionItem, Status } from "@/domain/items/items.types";
import { initials, savedTasks } from "@/domain/items/items.utils";
import { compareDueAsc, formatDate } from "@/lib/dates";

export const STATUS_STYLE: Record<
  Status,
  { bg: string; fg: string; border: string }
> = {
  "Not started": {
    bg: "hsl(var(--foreground) / 0.06)",
    fg: "hsl(var(--muted-foreground))",
    border: "hsl(var(--foreground) / 0.14)",
  },
  "In progress": {
    bg: "hsl(var(--primary) / 0.24)",
    fg: "hsl(var(--pill-blue))",
    border: "hsl(var(--primary) / 0.45)",
  },
  Blocked: {
    bg: "hsl(var(--magenta) / 0.16)",
    fg: "hsl(var(--pill-magenta))",
    border: "hsl(var(--magenta) / 0.4)",
  },
  Done: {
    bg: "hsl(var(--foreground) / 0.1)",
    fg: "hsl(var(--foreground))",
    border: "hsl(var(--foreground) / 0.2)",
  },
};

export interface TaskRowVM extends ActionItem {
  initials: string;
  /** Formatted due date, e.g. "Aug 14", or "—" when none. */
  dueLabel: string;
  /** Staggered entrance delay, e.g. "105ms". */
  delay: string;
}

export function taskRows(
  items: ActionItem[],
  filterOwner: string,
  filterStatus: string,
  filterPriority: string,
): TaskRowVM[] {
  return savedTasks(items)
    .filter(
      (it) =>
        (filterOwner === "All" || it.owner === filterOwner) &&
        (filterStatus === "All" || it.status === filterStatus) &&
        (filterPriority === "All" || it.priority === filterPriority),
    )
    .sort((a, b) => compareDueAsc(a.due, b.due))
    .map((it, idx) => ({
      ...it,
      initials: initials(it.owner),
      dueLabel: formatDate(it.due),
      delay: idx * 35 + "ms",
    }));
}
