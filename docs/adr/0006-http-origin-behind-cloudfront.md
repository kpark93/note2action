# 0006 — Plaintext HTTP between CloudFront and the ALB

**Status:** adopted (known trade-off) · **Date:** 2026-08-26

## Context

Browsers reach the app over HTTPS (CloudFront's default certificate). But an
ACM certificate for the ALB requires a custom domain, and this deployment
deliberately has none (demo scope, ~4-month credit runway, Clerk dev keys).

## Decision

CloudFront → ALB uses `origin_protocol_policy = "http-only"` on port 80.
Clerk JWTs therefore transit this hop unencrypted — **inside AWS's network**
(CloudFront origin-facing ranges to a VPC ALB), not the public internet.

## Consequences

- Accepted risk: AWS-internal path visibility; no exposure to the public net.
- The upgrade path is mechanical and bundled with one purchase: a domain
  buys ACM cert + `https-only` origin + Clerk production keys.
- Documented here precisely so it reads as a decision, not an oversight.
