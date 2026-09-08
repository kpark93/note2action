/** Auth-gate guard: the app must bounce signed-out visitors to /sign-in. */
import { test, expect } from "@playwright/test";

// No storageState: this spec runs as a signed-out visitor.
test.use({ storageState: { cookies: [], origins: [] } });

test("signed-out visit to /tasks redirects to sign-in", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/sign-in/);
});
