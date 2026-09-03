/** Pure view-model builders for the History screen — filtering and ordering
 * moved server-side (view=history keyset); grouping and stat tiles live here. */
import type { ItemSummary } from "@note2action/shared";
import type { ActionItem } from "@/domain/items/items.types";
import { formatDate, weekOf } from "@/lib/dates";

/** "Today" is pinned so the seeded due/completed dates stay meaningful. */
const TODAY = "2026-08-11";

export interface HistoryGroupVM {
  key: string;
  label: string;
  count: string;
  items: (ActionItem & { completedLabel: string })[];
}

/** Server-ordered Done items → week buckets, newest bucket first; each item
 * carries a pre-formatted completedLabel. Arrival order is preserved inside
 * a bucket — the server already sorted by completion. */
export function historyGroups(items: ActionItem[]): HistoryGroupVM[] {
  const groupMap: Record<string, ActionItem[]> = {};
  for (const it of items) {
    const k = weekOf(it.completed || TODAY);
    (groupMap[k] ||= []).push(it);
  }

  return Object.keys(groupMap)
    .sort()
    .reverse()
    .map((k) => ({
      key: k,
      label: k === weekOf(TODAY) ? "This week" : "Week of " + formatDate(k),
      count:
        groupMap[k].length + (groupMap[k].length === 1 ? " item" : " items"),
      items: groupMap[k].map((it) => ({
        ...it,
        completedLabel: formatDate(it.completed || ""),
      })),
    }));
}

export interface StatVM {
  label: string;
  value: string | number;
  /** 0-100 share drawn by the stat bar. */
  percent: number;
  barColor: string;
  delta: string;
}

/** The three StatCard tiles, computed from the server's summary counts —
 * loaded pages can't be the basis, they grow as the user scrolls. */
export function historyStats(summary: ItemSummary): StatVM[] {
  const donePct = summary.total
    ? Math.round((summary.done / summary.total) * 100)
    : 0;
  const onTimePct = summary.done
    ? Math.round((summary.onTime / summary.done) * 100)
    : 0;

  return [
    {
      label: "Completed all time",
      value: summary.done,
      percent: donePct,
      barColor: "hsl(var(--primary))",
      delta: `across ${summary.meetings} ${
        summary.meetings === 1 ? "meeting" : "meetings"
      }`,
    },
    {
      label: "Closed on or before due date",
      value: summary.done ? onTimePct + "%" : "—",
      percent: onTimePct,
      barColor: "hsl(var(--primary) / 0.65)",
      delta: summary.onTime + " of " + summary.done,
    },
    {
      label: "Still open",
      value: summary.open,
      percent: summary.total
        ? Math.round((summary.open / summary.total) * 100)
        : 0,
      barColor: "hsl(var(--muted-foreground))",
      delta: "in Tasks",
    },
  ];
}
