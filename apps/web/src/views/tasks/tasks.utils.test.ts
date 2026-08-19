import { describe, expect, it } from "vitest";
import { taskRows } from "./tasks.utils";
import { makeItem } from "@/test/fixtures";

describe("taskRows", () => {
  const rachel = makeItem({ owner: "Rachel Ng", due: "2026-08-20" });
  const kyleBlocked = makeItem({
    owner: "Kyle Park",
    status: "Blocked",
    due: "2026-08-12",
  });
  const kyleUndated = makeItem({ owner: "Kyle Park", due: "" });
  const unsaved = makeItem({ owner: "Kyle Park", saved: false });
  const done = makeItem({ owner: "Kyle Park", status: "Done" });
  const all = [rachel, kyleBlocked, kyleUndated, unsaved, done];

  it("shows only saved, still-open items", () => {
    const ids = taskRows(all, "All", "All", "All").map((r) => r.id);
    expect(ids).not.toContain(unsaved.id);
    expect(ids).not.toContain(done.id);
    expect(ids).toHaveLength(3);
  });

  it("sorts by due date with undated items last", () => {
    const ids = taskRows(all, "All", "All", "All").map((r) => r.id);
    expect(ids).toEqual([kyleBlocked.id, rachel.id, kyleUndated.id]);
  });

  it("filters by owner and status together", () => {
    expect(
      taskRows(all, "Kyle Park", "Blocked", "All").map((r) => r.id),
    ).toEqual([kyleBlocked.id]);
    expect(taskRows(all, "Rachel Ng", "Blocked", "All")).toHaveLength(0);
  });

  it("filters by priority, composing with the other filters", () => {
    const lowKyle = makeItem({ owner: "Kyle Park", priority: "Low" });
    const withLow = [...all, lowKyle];
    expect(taskRows(withLow, "All", "All", "Low").map((r) => r.id)).toEqual([
      lowKyle.id,
    ]);
    expect(taskRows(withLow, "Rachel Ng", "All", "Low")).toHaveLength(0);
  });

  it("derives the presentation fields", () => {
    const [first, , third] = taskRows(all, "All", "All", "All");
    expect(first.initials).toBe("KP");
    expect(first.dueLabel).toBe("Aug 12");
    expect(first.delay).toBe("0ms");
    expect(third.dueLabel).toBe("—");
    expect(third.delay).toBe("70ms");
  });
});
