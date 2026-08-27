# 0002 — AI is its own Next.js app

**Status:** adopted · **Date:** 2026-08-14

## Context

The AI features use the Vercel AI SDK, which is built for Next.js server
runtimes. The product frontend is a Vite SPA; the main backend is FastAPI.
The `ANTHROPIC_API_KEY` must never reach a browser.

## Decision

`apps/ai` is a standalone Next.js app used almost purely as API routes
(`/api/extract`, `/api/chat`). It is the only process holding the Anthropic
key. The SPA reaches it through the same-origin proxy (`/ai-api/*` → Vite in
dev, CloudFront in prod).

## Consequences

- The AI SDK, its key, and its deploy story stay isolated from both other apps.
- One more service to run/deploy (Compose service, Fargate task).
- The browser orchestrates: extract (ai app) then persist (api) — services
  never call each other.
- Since 2026-08-27 the AI app verifies Clerk JWTs itself (same JWKS pattern
  as the API), so "internal" no longer means "unauthenticated".
