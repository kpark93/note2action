import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionItem as WireActionItem } from "@note2action/shared";
import { toWirePatch } from "./items.api";

/** A complete, valid wire item — the base each contract case mutates. */
const WIRE_ITEM = {
  id: 1,
  meetingId: 1,
  meeting: "Sprint sync",
  title: "Ship it",
  owner: "Kyle",
  due: "2026-09-08",
  priority: "High",
  saved: false,
  note: null,
  status: "Not started",
  completed: null,
};

describe("wire ActionItem due contract", () => {
  it("accepts an ISO day and null", () => {
    expect(WireActionItem.safeParse(WIRE_ITEM).success).toBe(true);
    expect(WireActionItem.safeParse({ ...WIRE_ITEM, due: null }).success).toBe(
      true,
    );
  });

  it("rejects a malformed due date", () => {
    expect(
      WireActionItem.safeParse({ ...WIRE_ITEM, due: "banana" }).success,
    ).toBe(false);
  });
});

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
