import { describe, expect, it } from "vitest";
import { todayISO } from "@/lib/dates";
import { makeItem } from "@/test/fixtures";
import {
  applyPatch,
  applySummaryDelta,
  findInPages,
  clearPending,
  insertByIdOrder,
  keptOnSettle,
  patchPages,
  removeFromPages,
  removeItem,
  summaryAfterCapture,
  summaryAfterSaveAll,
} from "./items.cache";

describe("keptOnSettle", () => {
  it("keeps only the reconciled detail entry", () => {
    expect(keptOnSettle(["items", "detail", 7], { detailId: 7 })).toBe(true);
    expect(keptOnSettle(["items", "detail", 8], { detailId: 7 })).toBe(false);
  });

  it("keeps the summary only when the delta was applied", () => {
    expect(keptOnSettle(["items", "summary"], { summary: true })).toBe(true);
    expect(keptOnSettle(["items", "summary"], {})).toBe(false);
  });

  it("statusOnly keeps walks whose membership cannot change", () => {
    const keep = { statusOnly: true };
    expect(keptOnSettle(["items", "tasks", "All", "All"], keep)).toBe(true);
    expect(keptOnSettle(["items", "tasks", "All", "High"], keep)).toBe(true);
    expect(keptOnSettle(["items", "review"], keep)).toBe(true);
    expect(keptOnSettle(["items", "history"], keep)).toBe(true);
  });

  it("statusOnly still invalidates status-filtered tasks walks", () => {
    expect(
      keptOnSettle(["items", "tasks", "Blocked", "All"], {
        statusOnly: true,
      }),
    ).toBe(false);
  });

  it("review flag keeps the review cache and nothing else", () => {
    const keep = { review: true };
    expect(keptOnSettle(["items", "review"], keep)).toBe(true);
    expect(keptOnSettle(["items", "tasks", "All", "All"], keep)).toBe(false);
    expect(keptOnSettle(["items", "history"], keep)).toBe(false);
  });

  it("history flag keeps the history walk and nothing else", () => {
    const keep = { history: true };
    expect(keptOnSettle(["items", "history"], keep)).toBe(true);
    expect(keptOnSettle(["items", "tasks", "All", "All"], keep)).toBe(false);
    expect(keptOnSettle(["items", "review"], keep)).toBe(false);
  });

  it("tasks flag keeps every tasks walk, filtered or not", () => {
    const keep = { tasks: true };
    expect(keptOnSettle(["items", "tasks", "All", "All"], keep)).toBe(true);
    expect(keptOnSettle(["items", "tasks", "Blocked", "High"], keep)).toBe(
      true,
    );
    expect(keptOnSettle(["items", "history"], keep)).toBe(false);
    expect(keptOnSettle(["items", "review"], keep)).toBe(false);
  });

  it("keeps nothing without flags", () => {
    expect(keptOnSettle(["items", "tasks", "All", "All"], {})).toBe(false);
    expect(keptOnSettle(["items", "review"], {})).toBe(false);
  });
});

const SUMMARY = {
  done: 3,
  open: 5,
  review: 2,
  total: 8,
  onTime: 2,
  meetings: 4,
};

describe("applySummaryDelta", () => {
  it("moves an item from open to done, on time when undated", () => {
    const before = makeItem({
      status: "Not started",
      saved: true,
      due: undefined,
    });
    const after = applyPatch([before], before.id, { status: "Done" })[0];
    expect(applySummaryDelta(SUMMARY, before, after)).toEqual({
      ...SUMMARY,
      done: 4,
      open: 4,
      onTime: 3,
    });
  });

  it("counts a late completion as done but not on time", () => {
    const before = makeItem({
      status: "Blocked",
      saved: true,
      due: "2000-01-01",
    });
    const after = applyPatch([before], before.id, { status: "Done" })[0];
    expect(applySummaryDelta(SUMMARY, before, after)).toEqual({
      ...SUMMARY,
      done: 4,
      open: 4,
    });
  });

  it("returns an unsaved item to the review bucket on send-back", () => {
    const before = makeItem({ status: "In progress", saved: true });
    const after = { ...before, saved: false };
    expect(applySummaryDelta(SUMMARY, before, after)).toEqual({
      ...SUMMARY,
      review: 3,
    });
  });

  it("drops every bucket the item occupied on delete", () => {
    const before = makeItem({ status: "Not started", saved: false });
    expect(applySummaryDelta(SUMMARY, before, null)).toEqual({
      ...SUMMARY,
      open: 4,
      review: 1,
      total: 7,
    });
  });

  it("never touches the meetings count", () => {
    const before = makeItem({ status: "Not started", saved: true });
    const next = applySummaryDelta(SUMMARY, before, null);
    expect(next.meetings).toBe(SUMMARY.meetings);
  });
});

describe("summaryAfterCapture", () => {
  it("adds the new items to total/open/review and counts the meeting", () => {
    expect(summaryAfterCapture(SUMMARY, 3)).toEqual({
      ...SUMMARY,
      total: 11,
      open: 8,
      review: 5,
      meetings: 5,
    });
  });

  it("leaves done and onTime untouched — new items are never Done", () => {
    const next = summaryAfterCapture(SUMMARY, 2);
    expect(next.done).toBe(SUMMARY.done);
    expect(next.onTime).toBe(SUMMARY.onTime);
  });
});

describe("summaryAfterSaveAll", () => {
  it("empties the review bucket and changes nothing else", () => {
    expect(summaryAfterSaveAll(SUMMARY)).toEqual({ ...SUMMARY, review: 0 });
  });
});

describe("findInPages", () => {
  it("finds an item on any page", () => {
    const target = makeItem({ title: "Wanted" });
    const data = {
      pages: [
        { items: [makeItem()], nextCursor: "c1" },
        { items: [target], nextCursor: null },
      ],
    };
    expect(findInPages(data, target.id)).toEqual(target);
  });

  it("returns undefined for a missing item or absent cache", () => {
    expect(findInPages({ pages: [] }, 1)).toBeUndefined();
    expect(findInPages(undefined, 1)).toBeUndefined();
  });
});

describe("patchPages", () => {
  it("patches the matching item wherever it sits in the pages", () => {
    const target = makeItem({ title: "Old", status: "Not started" });
    const bystander = makeItem();
    const data = {
      pages: [
        { items: [bystander], nextCursor: "c1" },
        { items: [target], nextCursor: null },
      ],
      pageParams: [null, "c1"],
    };

    const next = patchPages(data, target.id, { status: "Done" });

    expect(next.pages[1].items[0].status).toBe("Done");
    // The server rule rides along: Done stamps completed.
    expect(next.pages[1].items[0].completed).toBe(todayISO());
    expect(next.pages[0].items[0]).toEqual(bystander);
    expect(next.pages[1].nextCursor).toBeNull();
  });
});

describe("removeFromPages", () => {
  it("removes the item from its page; other pages and cursors keep", () => {
    const bystander = makeItem();
    const target = makeItem();
    const data = {
      pages: [
        { items: [bystander], nextCursor: "c1" },
        { items: [target], nextCursor: null },
      ],
      pageParams: [null, "c1"],
    };

    const next = removeFromPages(data, target.id);

    expect(next.pages[1].items).toEqual([]);
    expect(next.pages[0].items).toEqual([bystander]);
    expect(next.pageParams).toEqual([null, "c1"]);
  });

  it("keeps a page's cursor even when its anchor row is removed", () => {
    const target = makeItem();
    const data = {
      pages: [{ items: [target], nextCursor: "points-at-target" }],
      pageParams: [null],
    };

    const next = removeFromPages(data, target.id);

    // Keyset WHEREs are strict inequalities — a vanished anchor still
    // partitions the walk correctly.
    expect(next.pages[0].nextCursor).toBe("points-at-target");
  });
});

describe("applyPatch", () => {
  it("applies field changes to the matching item only", () => {
    const a = makeItem({ title: "Alpha" });
    const b = makeItem({ title: "Beta" });

    const next = applyPatch([a, b], a.id, {
      title: "Alpha v2",
      owner: "Priya Shah",
    });

    expect(next[0]).toMatchObject({ title: "Alpha v2", owner: "Priya Shah" });
    expect(next[1]).toBe(b);
  });

  it("stamps completed with today when status becomes Done", () => {
    const item = makeItem({ status: "In progress", completed: null });

    const next = applyPatch([item], item.id, { status: "Done" });

    expect(next[0].status).toBe("Done");
    expect(next[0].completed).toBe(todayISO());
  });

  it("clears completed when status leaves Done", () => {
    const item = makeItem({ status: "Done", completed: "2026-08-14" });

    const next = applyPatch([item], item.id, { status: "Blocked" });

    expect(next[0].status).toBe("Blocked");
    expect(next[0].completed).toBeNull();
  });

  it("leaves completed alone when the patch has no status", () => {
    const item = makeItem({ status: "Done", completed: "2026-08-14" });

    const next = applyPatch([item], item.id, { title: "Renamed" });

    expect(next[0].completed).toBe("2026-08-14");
  });

  it("returns every item unchanged for an unknown id", () => {
    const item = makeItem();

    const next = applyPatch([item], item.id + 999, { title: "Nope" });

    expect(next[0]).toBe(item);
  });
});

describe("removeItem", () => {
  it("removes the matching item and keeps the rest", () => {
    const a = makeItem();
    const b = makeItem();

    expect(removeItem([a, b], a.id)).toEqual([b]);
  });
});

describe("insertByIdOrder", () => {
  it("inserts at the ascending-id position", () => {
    const a = makeItem({ saved: false });
    const b = makeItem({ saved: false });
    const c = makeItem({ saved: false });

    expect(insertByIdOrder([a, c], b)).toEqual([a, b, c]);
  });

  it("appends when the id is largest", () => {
    const a = makeItem({ saved: false });
    const b = makeItem({ saved: false });

    expect(insertByIdOrder([a], b)).toEqual([a, b]);
  });

  it("is a no-op when the item is already present", () => {
    const a = makeItem({ saved: false });
    const items = [a];

    expect(insertByIdOrder(items, { ...a, title: "Edited" })).toBe(items);
  });

  it("refuses non-members — saved or Done items never join Review", () => {
    const items = [makeItem({ saved: false })];

    expect(insertByIdOrder(items, makeItem({ saved: true }))).toBe(items);
    expect(
      insertByIdOrder(
        items,
        makeItem({ saved: false, status: "Done", completed: todayISO() }),
      ),
    ).toBe(items);
  });
});

describe("clearPending", () => {
  it("drops pending items; saved and Done rows stay", () => {
    const pending = makeItem({ saved: false, status: "In progress" });
    const done = makeItem({
      saved: false,
      status: "Done",
      completed: todayISO(),
    });
    const alreadySaved = makeItem({ saved: true, status: "Not started" });

    expect(clearPending([pending, done, alreadySaved])).toEqual([
      done,
      alreadySaved,
    ]);
  });
});
