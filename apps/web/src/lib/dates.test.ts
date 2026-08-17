import { describe, expect, it } from "vitest";
import { compareDueAsc, formatDate, todayISO, weekOf } from "./dates";

describe("formatDate", () => {
  it("formats an ISO day as a short US date", () => {
    expect(formatDate("2026-08-14")).toBe("Aug 14");
  });

  it("returns an em dash for an empty date", () => {
    expect(formatDate("")).toBe("—");
  });
});

describe("todayISO", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("weekOf", () => {
  // 2026-08-10 is a Monday.
  it("maps a mid-week day to the Monday that starts its week", () => {
    expect(weekOf("2026-08-11")).toBe("2026-08-10");
    expect(weekOf("2026-08-14")).toBe("2026-08-10");
  });

  it("maps a Monday to itself", () => {
    expect(weekOf("2026-08-10")).toBe("2026-08-10");
  });

  it("maps a Sunday to the Monday six days earlier", () => {
    expect(weekOf("2026-08-16")).toBe("2026-08-10");
  });
});

describe("compareDueAsc", () => {
  it("sorts earlier dates first", () => {
    expect(compareDueAsc("2026-08-10", "2026-08-14")).toBeLessThan(0);
    expect(compareDueAsc("2026-08-14", "2026-08-10")).toBeGreaterThan(0);
  });

  it("sorts empty (undated) entries last", () => {
    expect(compareDueAsc("", "2026-08-10")).toBeGreaterThan(0);
    expect(compareDueAsc("2026-08-10", "")).toBeLessThan(0);
    expect(compareDueAsc("", "")).toBe(0);
  });

  it("orders a full list as the Tasks view expects", () => {
    const sorted = ["", "2026-08-14", "2026-08-10"].sort(compareDueAsc);
    expect(sorted).toEqual(["2026-08-10", "2026-08-14", ""]);
  });
});
