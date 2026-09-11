/** Item option lists; STATUSES/PRIORITIES derive from the zod contract — no drift. */
import { Priority, Status } from "@note2action/shared";

export const STATUSES: Status[] = [...Status.options];
export const PRIORITIES: Priority[] = [...Priority.options];

/** Colors per priority, shared by PriorityBadge and Review's priority Select. */
export const PRIORITY_STYLE: Record<Priority, { bg: string; fg: string }> = {
  High: {
    bg: "hsl(var(--magenta) / 0.16)",
    fg: "hsl(var(--pill-magenta))",
  },
  Medium: {
    bg: "hsl(var(--primary) / 0.22)",
    fg: "hsl(var(--pill-blue))",
  },
  Low: {
    bg: "hsl(var(--foreground) / 0.07)",
    fg: "hsl(var(--muted-foreground))",
  },
};

/** Colors for each status pill, shared by Tasks' Select and RecentModal. */
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
