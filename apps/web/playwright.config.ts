/** E2E config: boots API (8002, e2e DB) + built web (4173) itself.
 * Postgres must already be running (docker compose up -d postgres). */
import { defineConfig } from "@playwright/test";

// Local env files (gitignored); CI provides the same values as real env.
for (const f of [".env", ".env.e2e", "../api/.env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* absent in CI */
  }
}
process.env.CLERK_PUBLISHABLE_KEY ??= process.env.VITE_CLERK_PUBLISHABLE_KEY;

/** App-role URL for the dedicated e2e database (never the dev DB). */
export const E2E_DB_URL =
  "postgresql+psycopg://note2action_app:note2action_app_dev@localhost:5432/note2action_e2e";

export default defineConfig({
  testDir: "./e2e",
  // The journey is stateful; one worker keeps ordering deterministic.
  workers: 1,
  fullyParallel: false,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /(global|auth)\.setup\.ts/ },
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
