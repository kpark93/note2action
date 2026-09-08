import { afterEach, describe, expect, it, vi } from "vitest";
import { toWirePatch } from "./items.api";

describe("toWirePatch", () => {
  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = "UTC";
  });

  it("stamps completedOn with the viewer's date when status becomes Done", () => {
    process.env.TZ = "America/Los_Angeles";
    vi.useFakeTimers();
    // 9/10 04:00 UTC = 9/9 9pm PDT: the stamp must say 9/9, not UTC's 9/10.
    vi.setSystemTime(new Date("2026-09-10T04:00:00Z"));
    expect(toWirePatch({ status: "Done" })).toEqual({
      status: "Done",
      completedOn: "2026-09-09",
    });
  });

  it("leaves non-Done patches unstamped", () => {
    expect(toWirePatch({ status: "In progress" })).toEqual({
      status: "In progress",
    });
    expect(toWirePatch({ title: "retitled" })).toEqual({ title: "retitled" });
  });

  it("still translates due alongside the stamp", () => {
    expect(toWirePatch({ status: "Done", due: "" })).toMatchObject({
      status: "Done",
      due: null,
    });
  });
});
