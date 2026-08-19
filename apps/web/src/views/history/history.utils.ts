import type { ActionItem } from "@/store/actionItems.types";
import { TODAY } from "@/store/actionItems.constants";
import { doneItems, openItems } from "@/lib/items";
import { formatDate, weekOf } from "@/lib/dates";

export interface HistoryGroupVM {
  key: string;
  label: string;
  count: string;
  items: (ActionItem & { completedLabel: string })[];
}

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
