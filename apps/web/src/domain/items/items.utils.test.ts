import { describe, expect, it } from "vitest";
import {
  doneItems,
  initials,
  openItems,
  pendingItems,
  savedTasks,
  summary,
} from "./items.utils";
import { makeItem } from "@/test/fixtures";

describe("initials", () => {
  it("uses first letters of first and last name", () => {
    expect(initials("Kyle Park")).toBe("KP");
  });

  it("uses a single letter for one-word names", () => {
    expect(initials("Cher")).toBe("C");
  });

  it("returns ? for Unassigned", () => {
    expect(initials("Unassigned")).toBe("?");
  });
});

describe("item partitions", () => {
  const done = makeItem({ status: "Done" });
  const pending = makeItem({ saved: false });
  const saved = makeItem({ saved: true });
  const all = [done, pending, saved];

  it("splits open vs done on status", () => {
    expect(openItems(all)).toEqual([pending, saved]);
    expect(doneItems(all)).toEqual([done]);
  });

  it("splits the open items into Review (unsaved) vs Tasks (saved)", () => {
    expect(pendingItems(all)).toEqual([pending]);
    expect(savedTasks(all)).toEqual([saved]);
  });
});

describe("summary", () => {
  it("computes counts and a rounded done percentage", () => {
    const s = summary([
      makeItem({ status: "Done" }),
      makeItem({ status: "In progress" }),
      makeItem({ status: "Not started" }),
    ]);
    expect(s).toEqual({
      donePct: "33%",
      doneCount: 1,
      openCount: 2,
      reviewCount: 0,
    });
  });

  it("counts every unsaved open item as awaiting review", () => {
    const s = summary([
      makeItem({ saved: false }),
      makeItem({ saved: false }),
      makeItem({ saved: true }), // already in Tasks
      makeItem({ saved: false, status: "Done" }), // closed, not reviewable
    ]);
    expect(s.reviewCount).toBe(2);
  });

  it("reports 0% for an empty list instead of dividing by zero", () => {
    expect(summary([]).donePct).toBe("0%");
  });
});
