/** Once per run: create → migrate → truncate the e2e database via the
 * API's venv (mirrors apps/api/tests/conftest.py). Clerk setup: Task 2. */
import { test as setup } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// apps/web is an ESM package ("type": "module"), so __dirname isn't
// available here — derive it from import.meta.url instead.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.resolve(__dirname, "../../api");
const PY = path.join(API_DIR, ".venv/bin/python");
const ALEMBIC = path.join(API_DIR, ".venv/bin/alembic");
const ADMIN = "postgresql://postgres:postgres@localhost:5432";
const ADMIN_E2E_URL = `${ADMIN.replace("postgresql://", "postgresql+psycopg://")}/note2action_e2e`;

/** Runs a python snippet inside the API venv; throws on non-zero exit. */
function py(code: string) {
  execFileSync(PY, ["-c", code], { cwd: API_DIR, stdio: "inherit" });
}

setup("prepare the e2e database", async () => {
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
