# AWS Hosting Design — note2action

**Date:** 2026-08-26
**Status:** Approved in chat (sections §1–§7), pending spec review
**Goal:** Host the full stack (Vite SPA, FastAPI api, Next.js ai, Postgres) on AWS,
optimizing for learning real AWS patterns within the new-model free-tier credit
envelope ($100 granted + $100 earnable, 6-month expiry).

## Constraints & decisions

- New-model AWS account (post-2025-07): credits, no monthly free allowances.
- Budget: $0 out of pocket. ~$47/mo burn → ~4 months runway on $200 credits,
  then `terraform destroy`. The Terraform stays as the reusable artifact.
- No custom domain. CloudFront default URL + Clerk **dev** instance keys.
- IaC: Terraform, local gitignored state, flat files in `infra/`.
- Week 1: earn the second $100 — five $20 tasks (EC2 launch+terminate,
  Lambda hello-world, Bedrock playground prompt; RDS and Budgets happen
  naturally in this build).

## §1 Architecture & request flow

```
                    ┌─ CloudFront distribution (xyz.cloudfront.net, HTTPS) ─┐
 browser ──────────▶│  default  /*        ──▶ S3 bucket (apps/web dist/)    │
                    │  behavior /api/*    ──▶ ALB ──▶ ECS api service       │
                    │  behavior /ai-api/* ──▶ ALB ──▶ ECS ai service        │
                    └────────────────────────────────────────────────────────┘
                                   (path rewrite /ai-api → /api, as in vite.config.ts)
     ECS Fargate cluster: 2 services, 1 task each, ARM64
       api task: FastAPI/uvicorn (apps/api/Dockerfile)
       ai  task: Next.js         (apps/ai/Dockerfile)
            └──▶ RDS Postgres 16, db.t4g.micro, private subnets
```

- One CloudFront origin URL = same-origin for the SPA; no CORS. CloudFront
  behaviors take over the Vite dev proxy's role; `lib/http.ts` relative paths
  work unchanged.
- ALB listener rules split `/api/*` and `/ai-api/*` to two target groups.
  Health checks: FastAPI `GET /api/health` (exists) and a new tiny
  `GET /api/health` route in apps/ai.
- CloudFront 403/404 → `/index.html` rewrite so React Router deep links work.
- SPA cache: hashed assets long-TTL; `index.html` no-cache.

## §2 Networking & security

- VPC 10.0.0.0/16, 2 AZs. Public subnets ×2: ALB + Fargate tasks (public
  IPs). Private subnets ×2: RDS only.
- **No NAT gateway** (~$32/mo). Tasks use public IPs for ECR pulls and
  outbound calls (Anthropic, Clerk JWKS); ingress locked by SGs.
- SG chain: `alb-sg` ← :80 from CloudFront managed prefix list only;
  `task-sg` ← `alb-sg` on 8000/3000; `rds-sg` ← `task-sg` on 5432.
- Secrets in SSM Parameter Store (standard tier, free): `DATABASE_URL`,
  `MIGRATIONS_DATABASE_URL`, `ANTHROPIC_API_KEY`, `CLERK_JWKS_URL`.
  Injected by ECS as container env at task start.
- IAM: task-execution role (ECR pull, CloudWatch logs, SSM read);
  task role empty — app code calls no AWS APIs.

## §3 Data layer

- RDS Postgres 16, db.t4g.micro, 20GB gp3, single-AZ, 1-day backups,
  deletion protection off (teardown-friendly).
- Two DB roles mirroring docker-compose: master user runs migrations;
  limited `note2action_app` user runs the app. Required regardless of AWS:
  row-level security depends on a non-superuser app role.
- Migrations: one-off ECS task — api image with command override
  `alembic upgrade head` — run from CI before each service deploy.

## §4 Build & deploy (CD)

GitHub Actions `deploy` job, `main` only, after existing CI gates:

1. Build api + ai images (linux/arm64), push to ECR.
2. Run migration task; abort deploy unless exit 0.
3. `aws ecs update-service --force-new-deployment` for both services.
4. `pnpm build` the SPA (`VITE_CLERK_PUBLISHABLE_KEY` from GH vars),
   `aws s3 sync dist/`, CloudFront invalidation of `/index.html`.

Auth: GitHub OIDC federation → scoped IAM deploy role. No long-lived AWS
keys in GitHub secrets.

## §5 Cost & guardrails

| Item                                  | $/mo     |
| ------------------------------------- | -------- |
| ALB                                   | ~17      |
| Fargate ×2 (0.25 vCPU / 0.5GB, ARM64) | ~14      |
| RDS db.t4g.micro + 20GB gp3           | ~14      |
| CloudFront, S3, ECR, CloudWatch       | ~2       |
| **Total**                             | **~$47** |

- AWS Budgets alerts at $50 / $120 / $180 cumulative spend.
- End of runway: `terraform destroy` (skip RDS final snapshot). All
  resources in this design are destroy-safe.

## §6 Terraform & repo layout

- `infra/` at repo root. Flat files by concern: `providers.tf`, `vpc.tf`,
  `alb.tf`, `ecs.tf`, `rds.tf`, `cloudfront.tf`, `s3.tf`, `ssm.tf`,
  `iam.tf`, `budgets.tf`, `outputs.tf`, `variables.tf`.
- Local Terraform state, gitignored. S3-backend state is a deliberate
  non-goal (solo project; future exercise).
- Secrets flow: `terraform.tfvars` (gitignored) → SSM parameters → ECS.

## §7 Verification

- `terraform output cloudfront_url` → `GET /api/health`, `GET /ai-api/health`.
- Sign in through Clerk dev instance on the CloudFront URL.
- Run one real capture: Extract → items persisted → Review renders.
- Check CloudWatch log groups for both services and the migration task.

## Non-goals

- Custom domain / ACM / Clerk production instance.
- Multi-AZ RDS, autoscaling, NAT gateway, WAF.
- S3 Terraform state backend.
- Keeping the stack alive past credit exhaustion.

## App changes required (small)

- apps/ai: add `GET /api/health` route (trivial JSON, used by ALB).
- apps/web: production Dockerfile path unused in prod (S3 serves dist);
  no code change — build happens in CI.
- CI: new `deploy` workflow job with OIDC role assumption.
