import { describe, expect, it } from "vitest";
import { todayISO } from "@/lib/dates";
import { makeItem } from "@/test/fixtures";
import {
  applyPatch,
  applySummaryDelta,
  findInPages,
  keptOnSettle,
  markAllSaved,
  patchPages,
  removeItem,
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
    expect(keptOnSettle(["items", "tasks", "All", "All", "All"], keep)).toBe(
      true,
    );
    expect(
      keptOnSettle(["items", "tasks", "Kyle Park", "All", "High"], keep),
    ).toBe(true);
    expect(keptOnSettle(["items", "review"], keep)).toBe(true);
    expect(keptOnSettle(["items", "history", "All"], keep)).toBe(true);
  });

  it("statusOnly still invalidates status-filtered tasks walks", () => {
    expect(
      keptOnSettle(["items", "tasks", "All", "Blocked", "All"], {
        statusOnly: true,
      }),
    ).toBe(false);
  });

  it("keeps nothing without flags", () => {
    expect(keptOnSettle(["items", "tasks", "All", "All", "All"], {})).toBe(
      false,
    );
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

describe("markAllSaved", () => {
  it("saves pending items but not Done or already-saved ones", () => {
    const pending = makeItem({ saved: false, status: "In progress" });
    const done = makeItem({
      saved: false,
      status: "Done",
      completed: todayISO(),
    });
    const alreadySaved = makeItem({ saved: true, status: "Not started" });

    const next = markAllSaved([pending, done, alreadySaved]);

    expect(next[0].saved).toBe(true);
    expect(next[1]).toBe(done);
    expect(next[2]).toBe(alreadySaved);
  });
});
