# 0003 — Persistence behind a repository protocol

**Status:** adopted · **Date:** 2026-08-17

## Context

The API needed real Postgres persistence without making every test need a
database, and the course plan (roadmap M2 → M9) called for swapping storage
without touching routes.

## Decision

`app/repositories/protocols.py` defines typed protocols; `memory.py`
implements them as in-memory fakes, `postgres/` as the real thing. The swap
happens in exactly one place (`app/main.py`, driven by the `REPOSITORY`
setting). Routes → services → repositories; nothing above the seam knows
which implementation is live.

## Consequences

- The whole API suite (27 pytest) runs with zero infrastructure, in ~0.1s.
- An opt-in integration suite (`pytest -m integration`) exercises the real
  Postgres implementations against a service container in CI.
- Every new query is written twice (fake + real) — the fake stays honest
  because both sides share the protocol and the integration suite catches drift.
