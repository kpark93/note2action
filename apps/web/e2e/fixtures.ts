/** Shared test base: intercepts the browser's /ai-api/extract call with a
 * canned payload — deterministic capture, the AI service never runs. */
import { test as base, expect } from "@playwright/test";
import type { ExtractedItem } from "@note2action/shared";

/** What "extraction" returns in every e2e run. */
export const STUB_ITEMS: ExtractedItem[] = [
  {
    title: "Ship pricing page copy",
    owner: "Kyle",
    priority: "High",
    due: "",
    note: "Quote from the notes.",
  },
  {
    title: "Book venue for offsite",
    owner: "Unassigned",
    priority: "Low",
    due: "",
    note: "Mentioned near the end.",
  },
];

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("**/ai-api/extract", (route) =>
      route.fulfill({ json: { items: STUB_ITEMS } }),
    );
    await use(page);
  },
});

export { expect };
