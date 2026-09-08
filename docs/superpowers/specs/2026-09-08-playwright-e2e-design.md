# Playwright E2E — design

2026-09-08. Approved in-session; implementation follows via a written plan.

## Goal

End-to-end tests that prove the seams unit tests can't: a note travels
capture → Review → Save to Tasks → status flips → History through the real
router, real TanStack cache, real API, and real Postgres, in a real browser.

## Non-goals

- Broad UI coverage (filters, pagination, empty states) — later, once the
  core suite proves it earns its keep.
- Testing the AI extractor's output quality — its call is stubbed.
- Cross-browser matrix — Chromium only until the suite is stable.

## Decisions

| Question    | Decision                                                                |
| ----------- | ----------------------------------------------------------------------- |
| Stack depth | Full real stack (web + API + Postgres); only the AI call stubbed        |
| Auth        | `@clerk/testing` against the Clerk dev instance — no bypass in app code |
| Scope       | Golden path + guards, 5 specs (journey spec carries several steps)      |
| CI          | New job from day one; traces uploaded on failure                        |

## Architecture

**Stack under test.** Dedicated `note2action_e2e` database, migrated by
alembic and truncated in Playwright global setup (same pattern as
`apps/api/tests/conftest.py`). Real API via uvicorn pointed at that DB with
the Clerk dev-instance JWKS URL. Web served by `vite preview` (built app).
Playwright's `webServer` array boots API and web and waits on both; Postgres
is assumed running (compose), as the API test suite already assumes.

**AI stub.** The browser calls the extractor directly (`/ai-api/extract`
via the Vite proxy) and then posts results to `/api/meetings` — so a shared
fixture intercepts that one route with `page.route` and returns a fixed
extraction payload. Deterministic, free, no fourth process. The AI service
itself never runs.

**Auth.** A setup project uses `@clerk/testing` to obtain a testing token
(skips bot detection), signs in as a `+clerk_test` email with the fixed OTP
`424242`, and saves the session to `apps/web/e2e/.auth/user.json`
(gitignored). Tests reuse it via `storageState`; the signed-out guard test
runs with no storage state.

**Isolation.** Global setup truncates the e2e DB, so every run starts
empty; the journey spec creates all its own data through the UI. `workers: 1`
— the journey is stateful. Parallelize only if the suite grows enough to
hurt.

## The suite

One serial journey spec plus guards:

1. Signed-out visit to `/tasks` redirects to `/sign-in`.
2. Golden path: capture a note → stubbed extraction fills Review → edit an
   item's priority and due date → Save all to Tasks → items appear in Tasks.
3. Flip an item to Done → it leaves Tasks, lands in History under
   "This week" with today's date on the viewer's calendar (guards the
   local-calendar fix).
4. Optimistic rollback: intercept the PATCH with a 500 → the UI reverts and
   an error toast shows.
5. Sidebar summary counts update after save and after Done.

Selectors are accessible roles/text (`getByRole`); `data-testid` only where
the DOM offers nothing stable.

## CI

New `e2e` job in `.github/workflows/ci.yml`: postgres service container →
alembic migrate → `playwright install --with-deps chromium` → run suite
(Playwright boots API + web itself) → upload HTML report + traces as an
artifact on failure. Chromium only.

Repo secrets required: `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY`
(dev instance), `E2E_CLERK_USER_EMAIL`.

## Files

- `apps/web/playwright.config.ts` — projects (setup, chromium), webServer
  array, storageState wiring
- `apps/web/e2e/` — `auth.setup.ts`, `fixtures.ts` (AI stub route),
  `journey.spec.ts`, `guards.spec.ts`
- `apps/web/package.json` — `@playwright/test`, `@clerk/testing`,
  `test:e2e` script
- `.gitignore` — `e2e/.auth/`, `playwright-report/`, `test-results/`
- `.github/workflows/ci.yml` — the `e2e` job

## Dependencies and risks

- **PR #24** (local-calendar dates) must merge before the History
  "today's date" assertion is written as local-calendar; otherwise that
  one assertion lands with #24.
- CI needs network egress to Clerk; a Clerk outage fails the e2e job.
  Accepted — auth is part of what's under test.
- The `+clerk_test` user and the two keys must exist in the Clerk dev
  instance and as repo secrets before CI can pass (manual, one-time).
