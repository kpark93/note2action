import { describe, expect, it } from "vitest";
import { flagSentence, reviewItems } from "./review.utils";
import { makeItem } from "@/test/fixtures";

describe("reviewItems", () => {
  it("shows only unsaved open items", () => {
    const pending = makeItem({ saved: false });
    const vms = reviewItems([
      pending,
      makeItem({ saved: true }),
      makeItem({ saved: false, status: "Done" }),
    ]);
    expect(vms.map((v) => v.id)).toEqual([pending.id]);
  });

  it("marks low confidence against the threshold and formats the pct", () => {
    const [low, high] = reviewItems([
      makeItem({ saved: false, confidence: 52 }),
      makeItem({ saved: false, confidence: 96 }),
    ]);
    expect(low.low).toBe(true);
    expect(low.pct).toBe("52%");
    expect(high.low).toBe(false);
  });

  it("staggers entrance delays by index", () => {
    const vms = reviewItems([
      makeItem({ saved: false }),
      makeItem({ saved: false }),
    ]);
    expect(vms.map((v) => v.delay)).toEqual(["0ms", "40ms"]);
  });
});

describe("flagSentence", () => {
  it("names the flagged count when there is one", () => {
    expect(flagSentence(2)).toBe(
      "2 items were low confidence and are flagged below.",
    );
  });

  it("celebrates when nothing is flagged", () => {
    expect(flagSentence(0)).toBe(
      "Everything came through with high confidence.",
    );
  });
});
