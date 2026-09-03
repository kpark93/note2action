import { describe, expect, it } from "vitest";
import { taskRows } from "./tasks.utils";
import { makeItem } from "@/test/fixtures";

describe("taskRows", () => {
  it("maps items to display rows without reordering — order is the server's", () => {
    const later = makeItem({ due: "2026-08-20" });
    const earlier = makeItem({ due: "2026-08-12" });
    expect(taskRows([later, earlier]).map((r) => r.id)).toEqual([
      later.id,
      earlier.id,
    ]);
  });

  it("derives initials and a formatted due label", () => {
    const [row] = taskRows([makeItem({ owner: "Kyle Park", due: "" })]);
    expect(row.initials).toBe("KP");
    expect(row.dueLabel).toBe("—");
  });

  it("staggers entrance delays but caps them for deep pages", () => {
    const rows = taskRows(Array.from({ length: 40 }, () => makeItem({})));
    expect(rows[0].delay).toBe("0ms");
    expect(rows[1].delay).toBe("35ms");
    expect(rows[39].delay).toBe(rows[12].delay);
  });
});
