/** The golden path in order; serial — each test continues the previous state. */
import { test, expect, STUB_ITEMS } from "./fixtures";

test.describe.serial("golden path", () => {
  test("capture a note and land in Review", async ({ page }) => {
    await page.goto("/capture");
    await page.getByPlaceholder("Meeting title").fill("Sprint sync");
    await page.getByPlaceholder("Paste your meeting notes here…").fill(
      // >12 words clears the Extract gate; content is otherwise irrelevant (stubbed).
      "Kyle to ship pricing copy this week. Someone should also remember to book the venue for the offsite.",
    );
    await page.getByRole("button", { name: "Extract action items" }).click();
    // Stubbed extraction persists via /api/meetings, then Review shows both.
    await expect(page.getByText(STUB_ITEMS[0].title)).toBeVisible();
    await expect(page.getByText(STUB_ITEMS[1].title)).toBeVisible();
  });

  test("edit due date and priority on a review card", async ({ page }) => {
    await page.goto("/review");
    // ReviewCard renders as <article>; a "div" filter can't scope to one card.
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
    // Wait for the bulk PATCH before navigating — /tasks reads the same rows.
    const patched = page.waitForResponse(
      (r) => r.request().method() === "PATCH" && r.url().includes("/api/items"),
    );
    await page.getByRole("button", { name: /Save \d+ to Tasks/ }).click();
    await patched;
    await page.goto("/tasks");
    await expect(page.getByText(STUB_ITEMS[0].title)).toBeVisible();
    await expect(page.getByText(STUB_ITEMS[1].title)).toBeVisible();
    // Proves the Review edit persisted server-side, not just optimistically.
    const editedRow = page
      .getByRole("button")
      .filter({ hasText: STUB_ITEMS[0].title })
      .last();
    await expect(editedRow).toContainText("Medium");
    await expect(editedRow).toContainText("Dec 31");
  });

  test("flip an item to Done; it leaves Tasks for History", async ({
    page,
  }) => {
    await page.goto("/tasks");
    const row = page
      .getByRole("button")
      .filter({ hasText: STUB_ITEMS[0].title })
      .last();
    await row.getByRole("combobox").click();
    // The PATCH fires from onAnimationEnd — register the wait before clicking.
    const patched = page.waitForResponse(
      (r) => r.request().method() === "PATCH" && r.url().includes("/api/items"),
    );
    await page.getByRole("option", { name: "Done" }).click();
    // Optimistic: the row leaves the open-tasks walk without a reload.
    await expect(page.getByText(STUB_ITEMS[0].title)).not.toBeVisible();
    // Don't navigate away until the animation-end PATCH actually lands.
    await patched;

    await page.goto("/history");
    // TODAY is pinned for demo data, so a live completion may land under "Week of".
    await expect(page.getByRole("heading", { level: 2 })).toContainText(
      /This week|Week of/,
    );
    await expect(page.getByText(STUB_ITEMS[0].title)).toBeVisible();
  });

  test("summary stats reflect the completion", async ({ page }) => {
    await page.goto("/history");
    // data-slot="card" scopes to one tile; a bare "div" filter misses the value.
    const completed = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Completed all time" });
    await expect(completed).toContainText("1");
    const open = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Still open" });
    await expect(open).toContainText("1");
  });

  test("a failed PATCH rolls the UI back and toasts", async ({ page }) => {
    await page.goto("/tasks");
    // Fail every item PATCH after this point — the optimistic flip must revert.
    await page.route("**/api/items/*", (route) =>
      route.request().method() === "PATCH"
        ? route.fulfill({ status: 500, json: { detail: "boom" } })
        : route.fallback(),
    );
    const row = page
      .getByRole("button")
      .filter({ hasText: STUB_ITEMS[1].title })
      .last();
    await row.getByRole("combobox").click();
    await page.getByRole("option", { name: "Done" }).click();
    await expect(
      page.getByText("Couldn't save the change — reverted."),
    ).toBeVisible();
    // The row is still here, still open — the rollback restored it.
    await expect(page.getByText(STUB_ITEMS[1].title)).toBeVisible();
  });
});
