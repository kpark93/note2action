/** Shared test fixtures — only imported by *.test.ts, never the app bundle. */
import type { ActionItem } from "@/domain/items/items.types";

let nextId = 1000;

/** A saved, open item; override what the test cares about. */
export function makeItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: nextId++,
    meetingId: 1,
    title: "Test item",
    owner: "Kyle Park",
    due: "2026-08-14",
    priority: "Medium",
    status: "Not started",
    saved: true,
    meeting: "Weekly Sync — Aug 10",
    completed: null,
    ...overrides,
  };
}
