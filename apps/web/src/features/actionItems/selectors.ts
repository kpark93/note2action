// Pure derivations over the item list — the read-side of `renderVals` from the
// v2 mock. No React, no store: functions take data in and return view models
// (including the exact colors the design used) out, so components stay thin and
// this stays unit-testable.
import type { ActionItem, Priority, Status } from "./types";
import { LOW_CONFIDENCE_THRESHOLD, TODAY } from "./constants";

export const PRIORITY_STYLE: Record<Priority, { bg: string; fg: string }> = {
  High: { bg: "rgba(233,48,192,.16)", fg: "#f77fe0" },
  Medium: { bg: "rgba(77,95,232,.22)", fg: "#a5b0ff" },
  Low: { bg: "rgba(255,255,255,.07)", fg: "#a7b1e4" },
};

export const STATUS_STYLE: Record<
  Status,
  { bg: string; fg: string; border: string }
> = {
  "Not started": { bg: "rgba(255,255,255,.05)", fg: "#c6cdf3", border: "rgba(255,255,255,.14)" },
  "In progress": { bg: "rgba(77,95,232,.24)", fg: "#b6c0ff", border: "rgba(122,140,255,.45)" },
  Blocked: { bg: "rgba(233,48,192,.16)", fg: "#f77fe0", border: "rgba(233,48,192,.4)" },
  Done: { bg: "rgba(255,255,255,.1)", fg: "#ffffff", border: "rgba(255,255,255,.2)" },
};

/** Card + badge styling for a review item, keyed on whether it's low-confidence. */
export function reviewStyle(low: boolean) {
  return {
    label: low ? "needs review" : "confident",
    pillBg: low ? "rgba(233,48,192,.14)" : "rgba(255,255,255,.06)",
    pillFg: low ? "#f77fe0" : "#a7b1e4",
    pillBorder: low ? "rgba(233,48,192,.4)" : "rgba(255,255,255,.1)",
    dot: low ? "#e930c0" : "#4d5fe8",
    cardBorder: low ? "rgba(233,48,192,.45)" : "rgba(255,255,255,.09)",
    cardShadow: low ? "0 10px 30px rgba(233,48,192,.16)" : "none",
    hoverShadow: low
      ? "0 16px 38px rgba(233,48,192,.26)"
      : "0 12px 30px rgba(5,9,26,.5)",
    hoverBorder: low ? "rgba(233,48,192,.65)" : "rgba(255,255,255,.18)",
    noteFg: low ? "#c6cdf3" : "#7c88b8",
  };
}

/** "Aug 14", or "—" for an empty date. */
export function formatDate(d: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function initials(owner: string): string {
  if (owner === "Unassigned") return "?";
  const parts = owner.split(" ");
  return parts[0][0] + (parts[1] ? parts[1][0] : "");
}

export function isLow(
  item: ActionItem,
  threshold = LOW_CONFIDENCE_THRESHOLD,
): boolean {
  return item.confidence < threshold;
}

/** ISO date of the Monday that starts the week containing `d`. */
function weekOf(d: string): string {
  const t = new Date(d + "T00:00:00");
  const monday = new Date(t);
  monday.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export const openItems = (items: ActionItem[]) =>
  items.filter((i) => i.status !== "Done");

export const doneItems = (items: ActionItem[]) =>
  items.filter((i) => i.status === "Done");

// ---- Review screen ---------------------------------------------------------

export interface ReviewItemVM extends ActionItem {
  low: boolean;
  pct: string;
  /** Staggered entrance delay, e.g. "120ms". */
  delay: string;
}

export function reviewItems(
  items: ActionItem[],
  threshold = LOW_CONFIDENCE_THRESHOLD,
): ReviewItemVM[] {
  return openItems(items).map((it, idx) => ({
    ...it,
    low: isLow(it, threshold),
    pct: it.confidence + "%",
    delay: idx * 40 + "ms",
  }));
}

export function flagSentence(flagCount: number): string {
  return flagCount
    ? `${flagCount} items were low confidence and are flagged below.`
    : "Everything came through with high confidence.";
}

// ---- Tasks screen ----------------------------------------------------------

export interface TaskRowVM extends ActionItem {
  initials: string;
  dueMeta: string;
  dueFg: string;
  /** Staggered entrance delay, e.g. "105ms". */
  delay: string;
}

export function taskRows(
  items: ActionItem[],
  filterOwner: string,
  filterStatus: string,
): TaskRowVM[] {
  return openItems(items)
    .filter(
      (it) =>
        (filterOwner === "All" || it.owner === filterOwner) &&
        (filterStatus === "All" || it.status === filterStatus),
    )
    .map((it, idx) => ({
      ...it,
      initials: initials(it.owner),
      dueMeta: it.due ? "Due " + formatDate(it.due) : "No date",
      dueFg: it.due ? "#a7b1e4" : "#6d7ab0",
      delay: idx * 35 + "ms",
    }));
}

// ---- History screen --------------------------------------------------------

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
      count: groupMap[k].length + (groupMap[k].length === 1 ? " item" : " items"),
      items: groupMap[k].map((it) => ({
        ...it,
        completedLabel: formatDate(it.completed || ""),
      })),
    }));
}

export interface StatVM {
  label: string;
  value: string | number;
  bar: string;
  barColor: string;
  delta: string;
}

export function historyStats(items: ActionItem[]): StatVM[] {
  const done = doneItems(items);
  const open = openItems(items);
  const total = items.length;
  const onTime = done.filter((i) => !i.due || (i.completed || "") <= i.due).length;
  const donePct = total ? Math.round((done.length / total) * 100) + "%" : "0%";
  const onTimePct = done.length ? Math.round((onTime / done.length) * 100) : 0;

  return [
    { label: "Completed all time", value: done.length, bar: donePct, barColor: "#e930c0", delta: "across 4 meetings" },
    { label: "Closed on or before due date", value: done.length ? onTimePct + "%" : "—", bar: onTimePct + "%", barColor: "#4d5fe8", delta: onTime + " of " + done.length },
    { label: "Still open", value: open.length, bar: total ? Math.round((open.length / total) * 100) + "%" : "0%", barColor: "#7a8cff", delta: "in Tasks" },
  ];
}

// ---- Sidebar summary -------------------------------------------------------

export interface Summary {
  donePct: string;
  doneCount: number;
  openCount: number;
  flagCount: number;
}

export function summary(
  items: ActionItem[],
  threshold = LOW_CONFIDENCE_THRESHOLD,
): Summary {
  const done = doneItems(items);
  const open = openItems(items);
  const total = items.length;
  return {
    donePct: total ? Math.round((done.length / total) * 100) + "%" : "0%",
    doneCount: done.length,
    openCount: open.length,
    flagCount: open.filter((i) => isLow(i, threshold)).length,
  };
}
