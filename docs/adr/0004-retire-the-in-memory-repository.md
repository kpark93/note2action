# ADR-0004 — Retire the in-memory repository

Date: 2026-09-06 · Status: accepted · Supersedes part of ADR-0003

## Context

ADR-0003 introduced the repository seam with two implementations: Postgres
for production and an in-memory fake for tests and Docker-free dev. Since
then the API grew server-side keyset pagination, filtered walks, and an
aggregate summary — behavior the fake had to mirror by hand. Every change
now meant writing the logic twice (SQL and a Python twin), and the twin
proved nothing about the real semantics: NULLS LAST ordering, cursor
comparisons, FILTER clauses, and RLS all live in Postgres.

## Decision

Delete `repositories/memory.py`. Every test runs against a real throwaway
Postgres database (`note2action_test`): created and migrated once per run,
truncated and reseeded per test — the machinery the integration suite
already used, promoted to the whole suite. The `REPOSITORY` switch is gone;
`protocols.py` stays as the typed contract, with Postgres its only
implementation.

## Consequences

- One source of truth for behavior; pagination changes are written once.
- `pytest` now requires the compose Postgres (it always ran locally anyway;
  CI's api job already had the service). Suite runtime grows from ~0.2s to
  a few seconds.
- Docker-free dev mode is gone — dev already required Postgres for real data.
- The unit/integration marker split dissolved: one suite, one command.
