# 0007 — Fargate tasks move to private subnets behind a NAT Gateway

**Status:** adopted · **Date:** 2026-08-28 · **Supersedes:** the "no NAT" cost
cheat recorded in the AWS hosting spec §2.

## Context

The original deployment put the Fargate tasks in public subnets with public
IPs so their outbound traffic (ECR pulls, Anthropic, Clerk JWKS) needed no
NAT (~$32/mo saved). Inbound was blocked by security groups — but that made
one SG rule the _only_ layer between the internet and the workloads, against
AWS Well-Architected / CIS guidance.

## Decision

Three-tier VPC. New private-app subnets (10.0.20–21.x) hold both services
with `assign_public_ip = false`; a single NAT Gateway in one public subnet
carries their egress. Public subnets keep only the ALB and the NAT. The
private-data tier (RDS, no internet route) is unchanged — it was never
public.

## Consequences

- Defense in depth: a fat-fingered SG rule no longer exposes the tasks —
  there is no inbound route to them at all.
- ~$32/mo + $0.045/GB processed; credit runway shortens from ~4 to ~2.5
  months.
- Single NAT in one AZ is an accepted outbound single-point at this scale;
  production would run one NAT per AZ.
- One-off tasks (migrations, in CI and `scripts/run-migrations.sh`) launch
  in the app subnets with `assignPublicIp=DISABLED`.
