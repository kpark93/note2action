# 0001 — Python lives outside the pnpm workspace

**Status:** adopted · **Date:** 2026-08-14

## Context

The monorepo is a pnpm workspace (web, ai, shared). The API is Python.
JS monorepo tooling and Python don't mix cleanly: pnpm can't manage a
virtualenv, and pretending it can produces half-working glue.

## Decision

`apps/api` is **not** a workspace member. uv owns its environment and
lockfile; root `package.json` scripts (`dev:api`, `test`) shell out to uv so
day-to-day commands still run from the repo root.

## Consequences

- Two lockfiles (`pnpm-lock.yaml`, `apps/api/uv.lock`), each idiomatic.
- CI has two jobs with different setup (pnpm vs `uv sync`) — see `ci.yml`.
- Contract sharing can't be an import: zod (`packages/shared`) is mirrored
  by pydantic (`app/schemas/`) by hand, with `docs/api-design.md` as referee.
