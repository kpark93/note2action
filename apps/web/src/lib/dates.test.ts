import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compareDueAsc,
  formatDate,
  formatInstantDate,
  todayISO,
  weekOf,
} from "./dates";

/** Runner pins TZ=UTC; these tests move the clock to prove local-calendar days. */
describe("local calendar across timezones", () => {
  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = "UTC";
  });

  it("todayISO returns the local date west of Greenwich", () => {
    process.env.TZ = "America/Los_Angeles";
    vi.useFakeTimers();
    // 9/10 04:00 UTC = 9/9 9pm PDT — UTC has rolled over, the viewer hasn't.
    vi.setSystemTime(new Date("2026-09-10T04:00:00Z"));
    expect(todayISO()).toBe("2026-09-09");
  });

  it("todayISO returns the local date east of Greenwich", () => {
    process.env.TZ = "Asia/Tokyo";
    vi.useFakeTimers();
    // 9/9 20:00 UTC = 9/10 5am JST — the viewer has rolled over, UTC hasn't.
    vi.setSystemTime(new Date("2026-09-09T20:00:00Z"));
    expect(todayISO()).toBe("2026-09-10");
  });

  it("weekOf keeps the Monday date east of Greenwich", () => {
    process.env.TZ = "Asia/Tokyo";
    expect(weekOf("2026-08-10")).toBe("2026-08-10");
  });

  it("formatInstantDate renders an instant's day on the viewer's calendar", () => {
    process.env.TZ = "America/Los_Angeles";
    // 9/10 04:00 UTC is still 9/9 for a PDT viewer.
    expect(formatInstantDate("2026-09-10T04:00:00+00:00")).toBe("Sep 9");
  });
});

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
