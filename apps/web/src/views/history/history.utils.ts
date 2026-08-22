// Pure view-model builders for the History screen — no network calls, no
// state. Takes the raw items from useItemsQuery and shapes them for display.
// Path: history.view.tsx → [this file] → items.utils (domain, doneItems etc).
import type { ActionItem } from "@/domain/items/items.types";
import { doneItems, openItems } from "@/domain/items/items.utils";
import { formatDate, weekOf } from "@/lib/dates";

/** "Today" is pinned so the seeded due/completed dates stay meaningful. */
const TODAY = "2026-08-11";

export interface HistoryGroupVM {
  key: string;
  label: string;
  count: string;
  items: (ActionItem & { completedLabel: string })[];
}

/**
 * Completed items, filtered by owner and grouped into week buckets
 * (newest first); each item carries a pre-formatted completedLabel.
 */
export function historyGroups(
  items: ActionItem[],
  historyOwner: string,
): HistoryGroupVM[] {
  const done = doneItems(items)
    .filter((i) => historyOwner === "All" || i.owner === historyOwner)
    .sort((a, b) => (b.completed || "").localeCompare(a.completed || ""));

  const groupMap: Record<string, ActionItem[]> = {};
  for (const it of done) {
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

/** Builds the three StatCard tiles: completed all-time, on-time rate, still open. */
export function historyStats(
  items: ActionItem[],
  meetingCount: number,
): StatVM[] {
  const done = doneItems(items);
  const open = openItems(items);
  const total = items.length;
  const onTime = done.filter(
    (i) => !i.due || (i.completed || "") <= i.due,
  ).length;
  const donePct = total ? Math.round((done.length / total) * 100) : 0;
  const onTimePct = done.length ? Math.round((onTime / done.length) * 100) : 0;

  return [
    {
      label: "Completed all time",
      value: done.length,
      percent: donePct,
      barColor: "hsl(var(--primary))",
      delta: `across ${meetingCount} ${meetingCount === 1 ? "meeting" : "meetings"}`,
    },
    {
      label: "Closed on or before due date",
      value: done.length ? onTimePct + "%" : "—",
      percent: onTimePct,
      barColor: "hsl(var(--primary) / 0.65)",
      delta: onTime + " of " + done.length,
    },
    {
      label: "Still open",
      value: open.length,
      percent: total ? Math.round((open.length / total) * 100) : 0,
      barColor: "hsl(var(--muted-foreground))",
      delta: "in Tasks",
    },
  ];
}
