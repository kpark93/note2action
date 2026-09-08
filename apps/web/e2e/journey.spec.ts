/** The golden path, in order: capture → Review edits → Save to Tasks.
 * Serial by design — each test continues the previous one's state. */
import { test, expect, STUB_ITEMS } from "./fixtures";

test.describe.serial("golden path", () => {
  test("capture a note and land in Review", async ({ page }) => {
    await page.goto("/capture");
    await page.getByPlaceholder("Meeting title").fill("Sprint sync");
    await page.getByPlaceholder("Paste your meeting notes here…").fill(
      // >12 words: clears NotesEditor's word-count gate on the Extract
      // button. Content is irrelevant otherwise — extraction is stubbed.
      "Kyle to ship pricing copy this week. Someone should also remember to book the venue for the offsite.",
    );
    await page.getByRole("button", { name: "Extract action items" }).click();
    // Stubbed extraction persists via /api/meetings, then Review shows both.
    await expect(page.getByText(STUB_ITEMS[0].title)).toBeVisible();
    await expect(page.getByText(STUB_ITEMS[1].title)).toBeVisible();
  });

  test("edit due date and priority on a review card", async ({ page }) => {
    await page.goto("/review");
    // ReviewCard renders as <article> — the review grid's wrapping <div>s
    // contain every card's text, so a "div" filter can't scope to one card.
    const card = page
      .getByRole("article")
      .filter({ hasText: STUB_ITEMS[0].title });
    await card.getByLabel("Due").fill("2026-12-31");
    await card.getByLabel("Due").blur();
    await card.getByLabel("Priority").click();
    await page.getByRole("option", { name: "Medium" }).click();
    // The optimistic patch keeps the card in place with the new priority.
    await expect(card.getByLabel("Priority")).toContainText("Medium");
  });

  test("save all to Tasks; items appear there", async ({ page }) => {
    await page.goto("/review");
    await page.getByRole("button", { name: /Save \d+ to Tasks/ }).click();
    await page.goto("/tasks");
    await expect(page.getByText(STUB_ITEMS[0].title)).toBeVisible();
    await expect(page.getByText(STUB_ITEMS[1].title)).toBeVisible();
  });
});
