import { describe, expect, it } from "vitest";
import { reviewItems, reviewSentence } from "./review.utils";
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

  it("staggers entrance delays by index", () => {
    const vms = reviewItems([
      makeItem({ saved: false }),
      makeItem({ saved: false }),
    ]);
    expect(vms.map((v) => v.delay)).toEqual(["0ms", "40ms"]);
  });
});

describe("reviewSentence", () => {
  it("names the waiting count, pluralized", () => {
    expect(reviewSentence(2)).toBe("2 items waiting for review.");
    expect(reviewSentence(1)).toBe("1 item waiting for review.");
  });

  it("celebrates an empty queue", () => {
    expect(reviewSentence(0)).toBe("Review queue is empty.");
  });
});
