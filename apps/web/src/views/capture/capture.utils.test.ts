import { describe, expect, it } from "vitest";
import { isTxtFilename, titleFromFilename } from "./capture.utils";

describe("isTxtFilename", () => {
  it("accepts .txt files regardless of case", () => {
    expect(isTxtFilename("notes.txt")).toBe(true);
    expect(isTxtFilename("WEEKLY-SYNC.TXT")).toBe(true);
  });

  it("rejects non-text files", () => {
    expect(isTxtFilename("photo.jpg")).toBe(false);
    expect(isTxtFilename("screenshot.png")).toBe(false);
    expect(isTxtFilename("setup.exe")).toBe(false);
  });

  it("rejects files with no extension or a disguised one", () => {
    expect(isTxtFilename("notes")).toBe(false);
    expect(isTxtFilename("notes.txt.exe")).toBe(false);
  });
});

describe("titleFromFilename", () => {
  it("strips the .txt extension for the meeting title", () => {
    expect(titleFromFilename("team-sync.txt")).toBe("team-sync");
    expect(titleFromFilename("Weekly Sync.TXT")).toBe("Weekly Sync");
  });
});
