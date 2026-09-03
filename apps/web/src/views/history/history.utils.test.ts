import { describe, expect, it } from "vitest";
import { historyGroups, historyStats } from "./history.utils";
import { makeItem } from "@/test/fixtures";

describe("historyGroups", () => {
  it("buckets by week, newest bucket first, preserving arrival order inside", () => {
    const thisWeekA = makeItem({ status: "Done", completed: "2026-08-11" });
    const thisWeekB = makeItem({ status: "Done", completed: "2026-08-10" });
    const older = makeItem({ status: "Done", completed: "2026-07-28" });
    const groups = historyGroups([thisWeekA, thisWeekB, older]);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe("This week");
    expect(groups[0].items.map((i) => i.id)).toEqual([
      thisWeekA.id,
      thisWeekB.id,
    ]);
    expect(groups[1].label).toMatch(/^Week of /);
  });

  it("pre-formats each item's completion label", () => {
    const [group] = historyGroups([
      makeItem({ status: "Done", completed: "2026-08-11" }),
    ]);
    expect(group.items[0].completedLabel).toBe("Aug 11");
  });
});

describe("historyStats", () => {
  const summary = {
    done: 4,
    open: 6,
    review: 2,
    total: 10,
    onTime: 3,
    meetings: 5,
  };

  it("builds the three tiles from summary counts alone", () => {
    const [completed, onTime, open] = historyStats(summary);
    expect(completed.value).toBe(4);
    expect(completed.delta).toBe("across 5 meetings");
    expect(onTime.value).toBe("75%");
    expect(onTime.delta).toBe("3 of 4");
    expect(open.value).toBe(6);
  });

  it("shows a dash for on-time rate when nothing is done yet", () => {
    const [, onTime] = historyStats({ ...summary, done: 0, onTime: 0 });
    expect(onTime.value).toBe("—");
  });
});
