/** Signs into Clerk once as the +clerk_test user; saves the session for authed specs. */
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";

setup("sign in and save session", async ({ page }) => {
  // Setup files run alphabetically — call clerkSetup() here too (idempotent).
  await clerkSetup();
  // Clerk needs a loaded app page before signIn can run.
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "email_code",
      identifier: process.env.E2E_CLERK_USER_EMAIL!,
    },
  });
  await page.goto("/");
  // The sidebar only renders signed-in — proves the session took.
  // await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.getByTestId("sidebar")).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
