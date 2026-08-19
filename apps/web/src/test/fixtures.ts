// Shared test fixtures. Not part of the app bundle — only imported by *.test.ts.
import type { ActionItem } from "@/store/actionItems.types";

let nextId = 1000;

/** A saved, open, high-confidence item; override what the test cares about. */
export function makeItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: nextId++,
    meetingId: 1,
    title: "Test item",
    owner: "Kyle Park",
    due: "2026-08-14",
    priority: "Medium",
    confidence: 90,
    status: "Not started",
    saved: true,
    meeting: "Weekly Sync — Aug 10",
    completed: null,
    ...overrides,
  };
}
