import { describe, expect, it } from "vitest";
import { reviewItems, reviewSentence } from "./review.utils";
import { makeItem } from "@/test/fixtures";

describe("reviewItems", () => {
  // Filtering to the pending queue moved server-side (view=review) —
  // this only decorates whatever the server sent, in its order.
  it("maps items to view models without filtering or reordering", () => {
    const a = makeItem({ saved: false });
    const b = makeItem({ saved: false });
    expect(reviewItems([a, b]).map((v) => v.id)).toEqual([a.id, b.id]);
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
