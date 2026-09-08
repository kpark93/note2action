# Playwright E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Browser E2E tests proving the capture → Review → Tasks → History journey against the real web + API + Postgres stack, with only the AI extract call stubbed, running locally and in CI.

**Architecture:** Playwright boots the API (uvicorn, port 8002, dedicated `note2action_e2e` DB) and the built web app (`vite preview`, port 4173, proxying `/api` to 8002) via its `webServer` array. A setup project signs into Clerk once (`@clerk/testing`) and saves `storageState`; a shared fixture intercepts `/ai-api/extract` in the browser with a canned payload. Global setup creates/migrates/truncates the e2e DB by shelling into the API's venv (same pattern as `apps/api/tests/conftest.py`).

**Tech Stack:** `@playwright/test`, `@clerk/testing`, pnpm workspace, vite preview, uvicorn, alembic.

**Spec:** `docs/superpowers/specs/2026-09-08-playwright-e2e-design.md`

## Global Constraints

- pnpm workspace; Node 22; all web work happens in `apps/web`.
- Ports: API under test **8002**, web preview **4173** (dev servers on 8001/5173 stay untouched).
- E2E database: `note2action_e2e` on `localhost:5432`; admin role `postgres:postgres`, app role `note2action_app:note2action_app_dev` (mirrors `apps/api/tests/conftest.py`).
- Required env (local: already in `apps/web/.env` / `apps/api/.env`; CI: secrets): `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY` (same value), `CLERK_SECRET_KEY`, `CLERK_JWKS_URL`, `E2E_CLERK_USER_EMAIL`.
- The Clerk test user is a `+clerk_test` email (fixed OTP `424242`) in the dev instance — created manually once, before Task 2 can pass.
- Selectors: accessible roles/labels only; no `data-testid` unless a task says so.
- Comment style: 2-line max headers, 1–2 lines elsewhere, `/** */` JSDoc.
- Timers are banned in test logic — rely on Playwright auto-waiting assertions (`await expect(locator)…`), never `waitForTimeout`.
- Postgres must be running locally (`docker compose up -d postgres`) — same assumption as the API test suite.

---

### Task 1: Scaffold Playwright + DB lifecycle + signed-out guard

**Files:**

- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/global.setup.ts`
- Create: `apps/web/e2e/guards.spec.ts`
- Modify: `apps/web/package.json` (devDeps + script)
- Modify: `.gitignore`

**Interfaces:**

- Produces: `pnpm run test:e2e` (from `apps/web`); Playwright projects `setup` → `chromium`; `E2E_DB_URL` wiring inside `playwright.config.ts`; global setup that leaves `note2action_e2e` migrated and empty.

- [ ] **Step 1: Install dependencies**

```bash
cd apps/web
pnpm add -D @playwright/test @clerk/testing
pnpm exec playwright install chromium
```

- [ ] **Step 2: Write the signed-out guard test (the failing test)**

`apps/web/e2e/guards.spec.ts`:

```ts
/** Auth-gate guard: the app must bounce signed-out visitors to /sign-in. */
import { test, expect } from "@playwright/test";

// No storageState: this spec runs as a signed-out visitor.
test.use({ storageState: { cookies: [], origins: [] } });

test("signed-out visit to /tasks redirects to sign-in", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/sign-in/);
});
```

- [ ] **Step 3: Run it to verify it fails for the right reason**

```bash
cd apps/web && pnpm exec playwright test e2e/guards.spec.ts
```

Expected: FAIL — no `playwright.config.ts`, no server to talk to ("Cannot navigate to invalid URL" or config-not-found). This is the "feature missing" failure.

- [ ] **Step 4: Write the config**

`apps/web/playwright.config.ts`:

```ts
/** E2E config: boots API (8002, e2e DB) + built web (4173) itself.
 * Postgres must already be running (docker compose up -d postgres). */
import { defineConfig } from "@playwright/test";

/** App-role URL for the dedicated e2e database (never the dev DB). */
export const E2E_DB_URL =
  "postgresql+psycopg://note2action_app:note2action_app_dev@localhost:5432/note2action_e2e";

export default defineConfig({
  testDir: "./e2e",
  // The journey is stateful; one worker keeps ordering deterministic.
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "./.venv/bin/uvicorn app.main:app --port 8002",
      cwd: "../api",
      url: "http://localhost:8002/api/health",
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: E2E_DB_URL,
        CLERK_JWKS_URL: process.env.CLERK_JWKS_URL ?? "",
      },
    },
    {
      // Build + preview: import.meta.env is baked at build time, so the
      // Clerk publishable key must be present in the build environment.
      command: "pnpm run build && pnpm exec vite preview --port 4173",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { VITE_API_PROXY_TARGET: "http://localhost:8002" },
    },
  ],
});
```

Note: `vite preview` inherits `server.proxy` (Vite's `preview.proxy` defaults to it), so `/api` forwards to 8002 without touching `vite.config.ts`.

- [ ] **Step 5: Write global setup (Clerk token + DB lifecycle)**

`apps/web/e2e/global.setup.ts`:

```ts
/** Once per run: Clerk testing token, then create → migrate → truncate the
 * e2e database via the API's venv (mirrors apps/api/tests/conftest.py). */
import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";

const API_DIR = path.resolve(__dirname, "../../api");
const PY = path.join(API_DIR, ".venv/bin/python");
const ALEMBIC = path.join(API_DIR, ".venv/bin/alembic");
const ADMIN = "postgresql://postgres:postgres@localhost:5432";
const ADMIN_E2E_URL = `${ADMIN.replace("postgresql://", "postgresql+psycopg://")}/note2action_e2e`;

/** Runs a python snippet inside the API venv; throws on non-zero exit. */
function py(code: string) {
  execFileSync(PY, ["-c", code], { cwd: API_DIR, stdio: "inherit" });
}

setup("prepare Clerk and the e2e database", async () => {
  await clerkSetup();

  py(`
import psycopg
with psycopg.connect("${ADMIN}/postgres", autocommit=True) as conn:
    try:
        conn.execute("CREATE DATABASE note2action_e2e")
    except psycopg.errors.DuplicateDatabase:
        pass
`);
  execFileSync(ALEMBIC, ["upgrade", "head"], {
    cwd: API_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: ADMIN_E2E_URL,
      MIGRATIONS_DATABASE_URL: ADMIN_E2E_URL,
    },
  });
  py(`
import psycopg
with psycopg.connect("${ADMIN}/note2action_e2e", autocommit=True) as conn:
    conn.execute("TRUNCATE action_items, meetings, users RESTART IDENTITY CASCADE")
`);
});
```

- [ ] **Step 6: Wire package.json and .gitignore**

In `apps/web/package.json` scripts, add:

```json
"test:e2e": "playwright test"
```

In root `.gitignore`, add:

```
apps/web/e2e/.auth/
apps/web/playwright-report/
apps/web/test-results/
```

- [ ] **Step 7: Run the guard test to verify it passes**

```bash
cd apps/web && pnpm exec playwright test e2e/guards.spec.ts
```

Expected: PASS (redirect asserted). The `setup` project also runs — if `CLERK_SECRET_KEY` is missing it will fail loudly; export the env first. The `chromium` project's `storageState` file doesn't exist yet, but this spec overrides storage state, so it must not be needed — if Playwright errors on the missing file, move the `test.use` override up or run with `--project=chromium` after Task 2; the guard test itself must not require auth.

- [ ] **Step 8: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e apps/web/package.json .gitignore pnpm-lock.yaml
git commit -m "test(e2e): Playwright scaffold, e2e DB lifecycle, signed-out guard"
```

---

### Task 2: Clerk sign-in setup + storageState

**Files:**

- Create: `apps/web/e2e/auth.setup.ts`
- Modify: `apps/web/playwright.config.ts` (setup project matches both setup files)

**Interfaces:**

- Consumes: `clerkSetup()` already ran in `global.setup.ts`.
- Produces: `apps/web/e2e/.auth/user.json` storage state that every `chromium` test reuses.

- [ ] **Step 1: Write the auth setup (this is the failing "test" — it fails until creds exist)**

`apps/web/e2e/auth.setup.ts`:

```ts
/** Signs into the Clerk dev instance once as the +clerk_test user (fixed
 * OTP) and saves the session for every authed spec to reuse. */
import { clerk } from "@clerk/testing/playwright";
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";

setup("sign in and save session", async ({ page }) => {
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
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
```

- [ ] **Step 2: Update the setup project to run both setup files in order**

In `playwright.config.ts`, replace the `setup` project line with:

```ts
    { name: "setup", testMatch: /(global|auth)\.setup\.ts/ },
```

(`global.setup.ts` sorts before `auth.setup.ts`, and `workers: 1` keeps them sequential.)

- [ ] **Step 3: Run setup and verify the state file appears**

```bash
cd apps/web && pnpm exec playwright test --project=setup
ls e2e/.auth/user.json
```

Expected: both setup tests PASS; `user.json` exists. If sign-in fails, the `+clerk_test` user or `E2E_CLERK_USER_EMAIL` env is missing — that's the manual one-time setup from the spec, not a code bug.

- [ ] **Step 4: Run the full suite (the sidebar assertion in Step 1 doubles as the authed smoke check)**

```bash
cd apps/web && pnpm run test:e2e
```

Expected: setup + signed-out guard PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/e2e/auth.setup.ts apps/web/playwright.config.ts
git commit -m "test(e2e): Clerk dev-instance sign-in with reusable storageState"
```

---

### Task 3: AI-stub fixture + golden path (capture → Review → Save → Tasks)

**Files:**

- Create: `apps/web/e2e/fixtures.ts`
- Create: `apps/web/e2e/journey.spec.ts`

**Interfaces:**

- Consumes: storage state from Task 2; `E2E_DB_URL` stack from Task 1.
- Produces: `test`/`expect` exports from `e2e/fixtures.ts` (extended with the AI stub) — Task 4 and 5 append to `journey.spec.ts` using them.

- [ ] **Step 1: Write the fixture**

`apps/web/e2e/fixtures.ts`:

```ts
/** Shared test base: intercepts the browser's /ai-api/extract call with a
 * canned payload — deterministic capture, the AI service never runs. */
import { test as base, expect } from "@playwright/test";

/** What "extraction" returns in every e2e run. */
export const STUB_ITEMS = [
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
```

- [ ] **Step 2: Write the golden-path spec (failing first — the flow exists, the test doesn't; watch it run against the real stack)**

`apps/web/e2e/journey.spec.ts`:

```ts
/** The golden path, in order: capture → Review edits → Save to Tasks.
 * Serial by design — each test continues the previous one's state. */
import { test, expect, STUB_ITEMS } from "./fixtures";

test.describe.serial("golden path", () => {
  test("capture a note and land in Review", async ({ page }) => {
    await page.goto("/capture");
    await page.getByPlaceholder("Meeting title").fill("Sprint sync");
    await page
      .getByPlaceholder("Paste your meeting notes here…")
      .fill(
        "Kyle to ship pricing copy. Someone should book the offsite venue.",
      );
    await page.getByRole("button", { name: "Extract action items" }).click();
    // Stubbed extraction persists via /api/meetings, then Review shows both.
    await expect(page.getByText(STUB_ITEMS[0].title)).toBeVisible();
    await expect(page.getByText(STUB_ITEMS[1].title)).toBeVisible();
  });

  test("edit due date and priority on a review card", async ({ page }) => {
    await page.goto("/review");
    const card = page
      .locator("div")
      .filter({ hasText: STUB_ITEMS[0].title })
      .last();
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
```

- [ ] **Step 3: Run the journey**

```bash
cd apps/web && pnpm exec playwright test e2e/journey.spec.ts
```

Expected: PASS. If a selector misses (Radix `Select` inside a `<label>` may not associate — `getByLabel("Priority")` can fail), fall back in this order: (1) `card.getByRole("combobox")` for the priority trigger, (2) only if that's ambiguous, add `data-testid="priority-select"` to the `SelectTrigger` in `apps/web/src/views/review/components/review-card.tsx` and use `card.getByTestId("priority-select")`. Same rule for the Due input (`card.locator('input[type="date"]')` is the fallback). Update the spec file to whichever selector proved real, run again to green.

- [ ] **Step 4: Run the whole suite twice in a row (idempotence — global setup must reset state)**

```bash
cd apps/web && pnpm run test:e2e && pnpm run test:e2e
```

Expected: PASS both times; the second run's truncate wipes the first run's rows.

- [ ] **Step 5: Commit**

```bash
git add apps/web/e2e/fixtures.ts apps/web/e2e/journey.spec.ts
git commit -m "test(e2e): AI-stubbed golden path — capture, review edits, save to Tasks"
```

---

### Task 4: Journey part 2 — Done flip, History, summary stats

**Files:**

- Modify: `apps/web/e2e/journey.spec.ts` (append to the serial describe)

**Interfaces:**

- Consumes: `test`/`expect`/`STUB_ITEMS` from `e2e/fixtures.ts`; the serial state left by Task 3 (two saved tasks, one due 2026-12-31 Medium).

- [ ] **Step 1: Append the failing tests**

Inside the same `test.describe.serial` block, after the save test:

```ts
test("flip an item to Done; it leaves Tasks for History", async ({ page }) => {
  await page.goto("/tasks");
  const row = page
    .locator("div, tr")
    .filter({ hasText: STUB_ITEMS[0].title })
    .last();
  await row.getByRole("combobox").click();
  await page.getByRole("option", { name: "Done" }).click();
  // Optimistic: the row leaves the open-tasks walk without a reload.
  await expect(page.getByText(STUB_ITEMS[0].title)).not.toBeVisible();

  await page.goto("/history");
  await expect(page.getByText("This week")).toBeVisible();
  await expect(page.getByText(STUB_ITEMS[0].title)).toBeVisible();
});

test("summary stats reflect the completion", async ({ page }) => {
  await page.goto("/history");
  // ItemSummary-backed tiles (history.utils.ts historyStats labels).
  const completed = page
    .locator("div")
    .filter({ hasText: "Completed all time" })
    .last();
  await expect(completed).toContainText("1");
  const open = page.locator("div").filter({ hasText: "Still open" }).last();
  await expect(open).toContainText("1");
});
```

The "today's local date" assertion on the History row (spec §suite item 3) depends on PR #24; once #24 is merged into this branch, extend the first test with:

```ts
const todayLabel = new Date().toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
});
await expect(
  page.locator("div, tr").filter({ hasText: STUB_ITEMS[0].title }).last(),
).toContainText(todayLabel);
```

If #24 is not yet merged when this task runs, leave the three lines out and note it in the commit body; add them in a follow-up commit after rebase.

- [ ] **Step 2: Run the journey spec**

```bash
cd apps/web && pnpm exec playwright test e2e/journey.spec.ts
```

Expected: PASS. Same selector-fallback rule as Task 3 Step 3 for the status combobox (`data-testid="status-select"` on `SelectTrigger` in `apps/web/src/views/tasks/components/task-row.tsx` as last resort).

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/journey.spec.ts
git commit -m "test(e2e): Done flip lands in History; summary tiles update"
```

---

### Task 5: Optimistic-rollback guard

**Files:**

- Modify: `apps/web/e2e/journey.spec.ts` (append — needs the surviving task row)

**Interfaces:**

- Consumes: serial state (one open task, `STUB_ITEMS[1].title`); toast copy from `apps/web/src/domain/items/items.queries.ts` rollback: `"Couldn't save the change — reverted."`.

- [ ] **Step 1: Append the failing test**

```ts
test("a failed PATCH rolls the UI back and toasts", async ({ page }) => {
  await page.goto("/tasks");
  // Fail every item PATCH after this point — the optimistic flip must revert.
  await page.route("**/api/items/*", (route) =>
    route.request().method() === "PATCH"
      ? route.fulfill({ status: 500, json: { detail: "boom" } })
      : route.fallback(),
  );
  const row = page
    .locator("div, tr")
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
```

- [ ] **Step 2: Run the full suite**

```bash
cd apps/web && pnpm run test:e2e
```

Expected: all specs PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/journey.spec.ts
git commit -m "test(e2e): failed PATCH reverts the optimistic flip and toasts"
```

---

### Task 6: CI job

**Files:**

- Modify: `.github/workflows/ci.yml` (new `e2e` job after `api`)

**Interfaces:**

- Consumes: repo secrets `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `E2E_CLERK_USER_EMAIL`, `CLERK_JWKS_URL` (must exist before this job can pass).

- [ ] **Step 1: Add the job**

Append to `jobs:` in `.github/workflows/ci.yml`:

```yaml
e2e:
  name: E2E (Playwright)
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:17.1-alpine
      env:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
      ports:
        - 5432:5432
      options: >-
        --health-cmd "pg_isready -U postgres"
        --health-interval 5s
        --health-timeout 5s
        --health-retries 10
  env:
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
    CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
    VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
    CLERK_JWKS_URL: ${{ secrets.CLERK_JWKS_URL }}
    E2E_CLERK_USER_EMAIL: ${{ secrets.E2E_CLERK_USER_EMAIL }}
    DATABASE_URL: postgresql+psycopg://unused:unused@localhost:5432/unused
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
    - uses: astral-sh/setup-uv@v5
    # The API venv powers uvicorn + alembic for the stack under test.
    - run: uv venv && uv pip install -e ".[dev,test]"
      working-directory: apps/api
    - run: pnpm install --frozen-lockfile
    - run: pnpm exec playwright install --with-deps chromium
      working-directory: apps/web
    - run: pnpm run test:e2e
      working-directory: apps/web
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: |
          apps/web/playwright-report/
          apps/web/test-results/
        retention-days: 7
```

Before writing, check how the existing `api` job installs the venv (the lines after `astral-sh/setup-uv@v5` in the current file) and copy that install command verbatim if it differs from `uv venv && uv pip install -e ".[dev,test]"`.

- [ ] **Step 2: Validate the workflow locally**

```bash
pnpm exec prettier --check .github/workflows/ci.yml || pnpm exec prettier --write .github/workflows/ci.yml
```

Expected: file formatted; YAML valid (Prettier parses it).

- [ ] **Step 3: Commit and push; watch the job**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: e2e job — Playwright against the real stack, traces on failure"
```

Push (with the human partner's go-ahead) and confirm the `e2e` job goes green on the PR. If it fails on missing secrets, that's the one-time manual setup — report, don't code around it.

## Self-review notes

- Spec coverage: suite items 1–5 map to Tasks 1 (item 1), 3 (item 2), 4 (items 3, 5), 5 (item 4); stack/auth/stub/CI map to Tasks 1, 2, 3, 6. The spec's "sidebar summary counts" is asserted via the History stat tiles (same `ItemSummary` source, labels known-stable) — recorded here as a deliberate substitution.
- The PR #24 dependency is handled inline in Task 4 with the exact optional code block.
- Selector fallbacks are ordered and bounded (role → locator → testid) to honor the no-testid-by-default constraint without leaving an executor stuck.
