#!/usr/bin/env bash
# Hermetic Postman E2E: scratch Postgres DB + self-signed JWKS + throwaway
# uvicorn, then the collection via newman. Needs the compose postgres running.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/apps/api"
PY="$API_DIR/.venv/bin/python"
RUN_DIR="$(mktemp -d)"
API_PORT="${POSTMAN_API_PORT:-8002}"
JWKS_PORT="${POSTMAN_JWKS_PORT:-8003}"
DB="note2action_postman"
ADMIN="postgresql://postgres:postgres@localhost:5432"

API_PID=""
JWKS_PID=""
cleanup() {
  status=$?
  # kill + wait pairs, so bash swallows the "Terminated" job notices.
  for pid in $API_PID $JWKS_PID; do
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
  # Boot logs are the only clue when the run dies before newman prints anything.
  if [ "$status" -ne 0 ] && [ -f "$RUN_DIR/api.log" ]; then
    tail -20 "$RUN_DIR/api.log" >&2
  fi
  rm -rf "$RUN_DIR"
}
trap cleanup EXIT

"$PY" "$API_DIR/scripts/mint_test_jwt.py" "$RUN_DIR"

"$PY" -m http.server "$JWKS_PORT" --bind 127.0.0.1 --directory "$RUN_DIR" \
  > /dev/null 2>&1 &
JWKS_PID=$!

# Same provisioning shape as tests/integration/conftest.py: the admin role
# creates and migrates the scratch DB; the API connects as the RLS-bound app role.
"$PY" - <<EOF
import psycopg
with psycopg.connect("$ADMIN/postgres", autocommit=True) as conn:
    conn.execute("DROP DATABASE IF EXISTS $DB WITH (FORCE)")
    conn.execute("CREATE DATABASE $DB")
EOF

(cd "$API_DIR" &&
  DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/$DB" \
  MIGRATIONS_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/$DB" \
  REPOSITORY=postgres \
  .venv/bin/alembic upgrade head)

# cwd stays at the repo root so apps/api/.env is NOT loaded — every setting the
# server sees is the explicit hermetic one below.
DATABASE_URL="postgresql+psycopg://note2action_app:note2action_app_dev@localhost:5432/$DB" \
  REPOSITORY=postgres \
  CLERK_JWKS_URL="http://127.0.0.1:$JWKS_PORT/jwks.json" \
  "$API_DIR/.venv/bin/uvicorn" app.main:app --app-dir "$API_DIR" \
  --port "$API_PORT" > "$RUN_DIR/api.log" 2>&1 &
API_PID=$!

curl --silent --fail --output /dev/null \
  --retry 30 --retry-delay 1 --retry-all-errors \
  "http://127.0.0.1:$API_PORT/api/health"

pnpm exec newman run "$API_DIR/postman/note2action-api.postman_collection.json" \
  -e "$API_DIR/postman/local.postman_environment.json" \
  --env-var "baseUrl=http://127.0.0.1:$API_PORT" \
  --env-var "tokenA=$(cat "$RUN_DIR/token_a.txt")" \
  --env-var "tokenB=$(cat "$RUN_DIR/token_b.txt")"
