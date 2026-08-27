# 0005 — One ALB, x-service header routing behind CloudFront

**Status:** adopted · **Date:** 2026-08-26

## Context

Prod needs one origin URL (same-origin, no CORS) fronting three things: the
SPA, FastAPI, and the AI app. CloudFront rewrites `/ai-api/*` → `/api/*`
(mirroring the Vite dev proxy), which makes both backends' paths identical
by the time they reach the load balancer — path-based ALB rules can't tell
them apart. A second ALB would double the largest fixed cost (~$17/mo).

## Decision

One ALB. CloudFront declares the same ALB as two origins, each stamping a
custom `x-service: api|ai` header; ALB listener rules route on that header.
Requests without the header hit a fixed 404.

## Consequences

- The header is **routing, not auth**: access is gated by the security group
  (ALB accepts only CloudFront's origin-facing prefix list) and by each
  service verifying Clerk JWTs.
- The rewrite lives in a 2-line CloudFront Function at the edge.
- Half the ALB cost; one more concept (origin custom headers) to explain.
