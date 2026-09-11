/** Pure History view-model builders — grouping and stat tiles; ordering is server-side. */
import type { ItemSummary } from "@note2action/shared";
import type { ActionItem } from "@/domain/items/items.types";
import { formatDate, todayISO, weekOf } from "@/lib/dates";

export interface HistoryGroupVM {
  key: string;
  label: string;
  count: string;
  items: (ActionItem & { completedLabel: string })[];
}

/** Done items → week buckets, newest first; arrival order kept (server-sorted). */
export function historyGroups(items: ActionItem[]): HistoryGroupVM[] {
  const today = todayISO();
  const groupMap: Record<string, ActionItem[]> = {};
  for (const it of items) {
    const k = weekOf(it.completed || today);
    (groupMap[k] ||= []).push(it);
  }

  return Object.keys(groupMap)
    .sort()
    .reverse()
    .map((k) => ({
      key: k,
      label: k === weekOf(today) ? "This week" : "Week of " + formatDate(k),
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

/** The three StatCard tiles from summary counts — loaded pages grow, so never them. */
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
