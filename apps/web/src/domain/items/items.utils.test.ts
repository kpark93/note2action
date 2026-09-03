import { describe, expect, it } from "vitest";
import { initials } from "./items.utils";

describe("initials", () => {
  it("uses first letters of first and last name", () => {
    expect(initials("Kyle Park")).toBe("KP");
  });

  it("uses a single letter for one-word names", () => {
    expect(initials("Cher")).toBe("C");
  });

  it("returns ? for Unassigned", () => {
    expect(initials("Unassigned")).toBe("?");
  });
});
