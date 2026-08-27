# 0004 — Postgres RLS enforces per-user isolation

**Status:** adopted · **Date:** 2026-08-20

## Context

Per-user data isolation enforced only by application-level `WHERE user_id =`
filters fails open: one forgotten filter leaks another user's rows.

## Decision

Row-Level Security in Postgres (migration `ba1b688e106a`): the API connects
as the low-privilege `note2action_app` role, announces the verified user per
transaction via `set_config('app.user_id', …)`, and owner-only policies on
`meetings` and `action_items` make cross-user reads/writes impossible at the
database. Unset user → zero rows (fails closed).

## Consequences

- Two connection URLs: `DATABASE_URL` (app role, RLS applies) and
  `MIGRATIONS_DATABASE_URL` (admin role for DDL — superusers bypass RLS).
- The RLS migration creates the app role with a dev password; deployments
  must rotate it (see `scripts/run-migrations.sh`).
- Defense in depth: middleware (401) → repository filters (404) → RLS.
