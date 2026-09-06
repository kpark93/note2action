import { describe, expect, it } from "vitest";
import { latestExtractionStatus } from "./extraction.utils";

describe("latestExtractionStatus", () => {
  it("is idle with no attempts", () => {
    expect(latestExtractionStatus([])).toEqual({
      extracting: false,
      extractError: null,
    });
  });

  it("reports the newest attempt, not an older failure", () => {
    const states = [
      { status: "error", error: new Error("AI app down") },
      { status: "pending", error: null },
    ];
    expect(latestExtractionStatus(states)).toEqual({
      extracting: true,
      extractError: null,
    });
  });

  it("surfaces the latest failure's message", () => {
    const states = [{ status: "error", error: new Error("HTTP 500") }];
    expect(latestExtractionStatus(states)).toEqual({
      extracting: false,
      extractError: "HTTP 500",
    });
  });

  it("falls back to a generic message for non-Error throws", () => {
    expect(
      latestExtractionStatus([{ status: "error", error: "boom" }]),
    ).toEqual({ extracting: false, extractError: "Extraction failed" });
  });

  it("is idle again after a success", () => {
    const states = [
      { status: "error", error: new Error("old") },
      { status: "success", error: null },
    ];
    expect(latestExtractionStatus(states)).toEqual({
      extracting: false,
      extractError: null,
    });
  });
});
