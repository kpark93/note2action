import { describe, expect, it } from "vitest";
import { historyGroups, historyStats } from "./history.utils";
import { makeItem } from "@/test/fixtures";

// TODAY is pinned to 2026-08-11 (a Tuesday), so "this week" starts 2026-08-10.
const thisWeek = makeItem({ status: "Done", completed: "2026-08-10" });
const lastWeek = makeItem({
  status: "Done",
  completed: "2026-08-05",
  owner: "Rachel Ng",
});

describe("historyGroups", () => {
  it("groups done items by week, newest week first", () => {
    const groups = historyGroups([thisWeek, lastWeek, makeItem()], "All");
    expect(groups.map((g) => g.key)).toEqual(["2026-08-10", "2026-08-03"]);
    expect(groups[0].label).toBe("This week");
    expect(groups[1].label).toBe("Week of Aug 3");
  });

  it("pluralizes the per-week count", () => {
    const groups = historyGroups(
      [thisWeek, makeItem({ status: "Done", completed: "2026-08-11" })],
      "All",
    );
    expect(groups[0].count).toBe("2 items");
    expect(historyGroups([lastWeek], "All")[0].count).toBe("1 item");
  });

  it("filters by owner and formats each completed date", () => {
    const groups = historyGroups([thisWeek, lastWeek], "Rachel Ng");
    expect(groups).toHaveLength(1);
    expect(groups[0].items[0].completedLabel).toBe("Aug 5");
  });
});

describe("historyStats", () => {
  it("computes completed, on-time, and open tiles", () => {
    const [completed, onTime, open] = historyStats([
      makeItem({ status: "Done", due: "2026-08-10", completed: "2026-08-10" }),
      makeItem({ status: "Done", due: "2026-08-10", completed: "2026-08-12" }),
      makeItem({ status: "In progress" }),
    ]);
    expect(completed.value).toBe(2);
    expect(onTime.value).toBe("50%");
    expect(onTime.delta).toBe("1 of 2");
    expect(open.value).toBe(1);
  });

  it("treats undated done items as on time and shows — with no completions", () => {
    const [, onTime] = historyStats([
      makeItem({ status: "Done", due: "", completed: "2026-08-12" }),
    ]);
    expect(onTime.value).toBe("100%");

    const [, none] = historyStats([makeItem()]);
    expect(none.value).toBe("—");
  });
});
