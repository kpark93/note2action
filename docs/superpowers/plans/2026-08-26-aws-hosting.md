# AWS Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Host note2action (Vite SPA + FastAPI + Next.js ai + Postgres) on AWS behind one CloudFront URL, defined entirely in Terraform, deployed by GitHub Actions.

**Architecture:** CloudFront serves the SPA from S3 and path-routes `/api/*` and `/ai-api/*` to an ALB, which header-routes to two Fargate services (FastAPI on 8000, Next.js on 3000) backed by RDS Postgres. GitHub Actions builds ARM64 images to ECR and rolls the services via an OIDC-assumed role.

**Tech Stack:** Terraform (aws provider ~> 6.0), ECS Fargate (ARM64), RDS Postgres 16, CloudFront + S3 + CloudFront Functions, SSM Parameter Store, GitHub Actions OIDC.

**Spec:** `docs/superpowers/specs/2026-08-26-aws-hosting-design.md`

## Global Constraints

- Region `us-east-1`; every resource name prefixed `note2action`.
- All compute ARM64 (Fargate `ARM64`, images built `linux/arm64`).
- **No NAT gateway.** Tasks live in public subnets with public IPs.
- Terraform ≥ 1.10, aws provider `~> 6.0`, **local state** — `infra/*.tfstate*` and `infra/*.tfvars` gitignored.
- Secrets only via `terraform.tfvars` → SSM SecureString → ECS `secrets`. Never in git, images, or task-def `environment`.
- Cost ceiling ~$47/mo; anything above (NAT, multi-AZ RDS, Fargate > 0.25 vCPU/0.5GB) is out of scope.
- Clerk **dev** instance; CloudFront default domain; HTTP (port 80) between CloudFront and ALB.
- Ask Kyle before each `git commit` (standing rule) and before each `terraform apply` (real money).
- SSM parameter names: `/note2action/database-url`, `/note2action/migrations-database-url`, `/note2action/app-db-password`, `/note2action/anthropic-api-key`, `/note2action/clerk-jwks-url`.

---

### Task 0: AWS account bootstrap + credit tasks (manual, no code)

**Files:** none.

**Interfaces:**

- Produces: AWS CLI profile `note2action` with admin credentials; $200 credit balance; `terraform` ≥ 1.10 and `aws` CLI installed.

- [ ] **Step 1: IAM user for Terraform**

In the AWS console (as root, once): IAM → Users → Create `terraform-admin`, attach `AdministratorAccess`, create access key (CLI type). Then locally:

```bash
aws configure --profile note2action   # paste key id/secret, region us-east-1, output json
aws sts get-caller-identity --profile note2action
```

Expected: JSON with `"Arn": "arn:aws:iam::<account>:user/terraform-admin"`.

- [ ] **Step 2: Install tooling**

```bash
brew install terraform awscli
terraform version   # >= 1.10
```

- [ ] **Step 3: Earn the three credit tasks not covered by this build ($60)**

1. EC2: console → Launch instance → `t4g.micro`, Amazon Linux, no key pair → wait `running` → Terminate.
2. Lambda: console → Create function → Author from scratch, Python, default code → Test with default event → Delete function.
3. Bedrock: console → Playgrounds → select any available model → send one prompt.

(RDS and Budgets tasks are earned by Tasks 6 and 13 of this plan.)

- [ ] **Step 4: Verify credits**

Billing console → Credits: expect $160 now ($100 base + $60), $200 after Tasks 6 and 13 register.

---

### Task 1: ai app health route

**Files:**

- Create: `apps/ai/app/api/health/route.ts`
- Test: `apps/ai/app/api/health/route.test.ts`

**Interfaces:**

- Produces: `GET /api/health` → `200 {"status":"ok"}` on the ai app — the ALB ai target group's health-check path (Task 9 sets `path = "/api/health"` on port 3000).

- [ ] **Step 1: Write the failing test**

```ts
/** Pins the ALB health-check contract: 200 + {status:"ok"}. */
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @note2action/ai test`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implement**

```ts
/** GET /api/health — liveness for the ALB target group; no dependencies. */
export function GET(): Response {
  return Response.json({ status: "ok" });
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @note2action/ai test`
Expected: all pass (previous 5 + 1 new).

- [ ] **Step 5: Commit** (ask Kyle)

```bash
git add apps/ai/app/api/health/
git commit -m "feat(ai): health route for the ALB target group"
```

---

### Task 2: production stage for the ai image

**Files:**

- Modify: `apps/ai/Dockerfile`
- Modify: `docker-compose.yml` (ai service: add `target: dev`)

**Interfaces:**

- Produces: `docker build --target prod -f apps/ai/Dockerfile .` → image running `next start -p 3000`; default (targetless) compose build keeps dev behavior via explicit `target: dev`.

- [ ] **Step 1: Rewrite the Dockerfile as multi-stage**

```dockerfile
# Multi-stage image for the Next.js app in the pnpm workspace.
# Build context is the repo root. `dev` = pnpm dev (compose); `prod` = built app.
FROM node:22-slim AS base

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/ai/package.json apps/ai/
RUN pnpm install --frozen-lockfile

COPY . .
WORKDIR /repo/apps/ai
EXPOSE 3000

FROM base AS dev
CMD ["pnpm", "dev"]

FROM base AS prod
RUN pnpm build
CMD ["pnpm", "start"]
```

- [ ] **Step 2: Pin compose to the dev stage**

In `docker-compose.yml`, ai service `build:` block gains one line:

```yaml
target: dev
```

- [ ] **Step 3: Verify prod image boots and serves health**

```bash
cd /Users/macbook/note2action
docker build --target prod -f apps/ai/Dockerfile -t n2a-ai-prod .
docker run --rm -d -p 3100:3000 --name n2a-ai-prod n2a-ai-prod
sleep 3 && curl -s http://localhost:3100/api/health
docker rm -f n2a-ai-prod
```

Expected: `{"status":"ok"}`.

- [ ] **Step 4: Verify compose still builds dev**

Run: `docker compose build ai` — succeeds; `docker compose config | grep -A4 "ai:"` shows `target: dev`.

- [ ] **Step 5: Commit** (ask Kyle)

```bash
git add apps/ai/Dockerfile docker-compose.yml
git commit -m "build(ai): prod image stage (next build + start); compose pins dev stage"
```

---

### Task 3: Terraform skeleton

**Files:**

- Create: `infra/versions.tf`, `infra/providers.tf`, `infra/variables.tf`, `infra/outputs.tf`, `infra/terraform.tfvars.example`
- Modify: `.gitignore`

**Interfaces:**

- Produces: `terraform -chdir=infra init/validate` pass; variables `region`, `db_master_password`, `app_db_password`, `anthropic_api_key`, `clerk_jwks_url`, `budget_email`, `github_repo` available to all later tasks; `local.name = "note2action"`.

- [ ] **Step 1: Write the files**

`infra/versions.tf`:

```hcl
terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
```

`infra/providers.tf`:

```hcl
provider "aws" {
  region  = var.region
  profile = "note2action"
  default_tags {
    tags = { project = "note2action", managed_by = "terraform" }
  }
}

locals {
  name = "note2action"
}
```

`infra/variables.tf`:

```hcl
variable "region" {
  type    = string
  default = "us-east-1"
}

variable "db_master_password" {
  type      = string
  sensitive = true
}

variable "app_db_password" {
  type      = string
  sensitive = true
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
}

variable "clerk_jwks_url" {
  type = string
}

variable "budget_email" {
  type = string
}

variable "github_repo" {
  type    = string
  default = "kpark93/note2action"
}
```

`infra/outputs.tf` (placeholder-free; grows in later tasks):

```hcl
output "region" {
  value = var.region
}
```

`infra/terraform.tfvars.example`:

```hcl
db_master_password = "change-me-strong"
app_db_password    = "change-me-strong-too"
anthropic_api_key  = "sk-ant-..."
clerk_jwks_url     = "https://your-instance.clerk.accounts.dev/.well-known/jwks.json"
budget_email       = "kpstarry@gmail.com"
```

`.gitignore` additions:

```
infra/.terraform/
infra/*.tfstate*
infra/terraform.tfvars
```

- [ ] **Step 2: Init + validate**

```bash
terraform -chdir=infra init
terraform -chdir=infra validate && terraform -chdir=infra fmt -check
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 3: Create real tfvars locally**

`cp infra/terraform.tfvars.example infra/terraform.tfvars`, fill real values (Clerk JWKS URL from the Clerk dashboard → API keys; passwords via `openssl rand -base64 24`). Confirm `git status` does NOT list `infra/terraform.tfvars`.

- [ ] **Step 4: Commit** (ask Kyle)

```bash
git add infra/ .gitignore
git commit -m "infra: terraform skeleton — providers, variables, tfvars example"
```

---

### Task 4: VPC

**Files:**

- Create: `infra/vpc.tf`

**Interfaces:**

- Produces: `aws_vpc.main`, `aws_subnet.public[0..1]`, `aws_subnet.private[0..1]` — referenced by ALB (public), ECS services (public), RDS subnet group (private).

- [ ] **Step 1: Write vpc.tf**

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = local.name }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = { Name = "${local.name}-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, 10 + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "${local.name}-private-${count.index}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
```

(Private subnets keep the VPC's default route table: no internet route — RDS only.)

- [ ] **Step 2: Validate + plan**

```bash
terraform -chdir=infra validate
terraform -chdir=infra plan
```

Expected: plan shows 9 to add (1 VPC, 1 IGW, 4 subnets, 1 RT, 2 assoc), 0 destroy.

- [ ] **Step 3: Apply** (ask Kyle — first real resources; all free)

```bash
terraform -chdir=infra apply
```

- [ ] **Step 4: Commit** (ask Kyle)

```bash
git add infra/vpc.tf
git commit -m "infra: vpc — 2 public + 2 private subnets, igw, public routes"
```

---

### Task 5: Security groups

**Files:**

- Create: `infra/security-groups.tf`

**Interfaces:**

- Produces: `aws_security_group.alb`, `aws_security_group.task`, `aws_security_group.rds` — SG chain: CloudFront prefix list → alb:80; alb → task:8000/3000; task → rds:5432.

- [ ] **Step 1: Write security-groups.tf**

```hcl
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "alb" {
  name   = "${local.name}-alb"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "task" {
  name   = "${local.name}-task"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  name   = "${local.name}-rds"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.task.id]
  }
}
```

- [ ] **Step 2: Validate, plan, apply** (ask Kyle; free)

```bash
terraform -chdir=infra validate && terraform -chdir=infra apply
```

Expected: 3 to add.

- [ ] **Step 3: Commit** (ask Kyle)

```bash
git add infra/security-groups.tf
git commit -m "infra: security-group chain cloudfront->alb->tasks->rds"
```

---

### Task 6: RDS + SSM parameters

**Files:**

- Create: `infra/rds.tf`, `infra/ssm.tf`
- Modify: `infra/outputs.tf`

**Interfaces:**

- Produces: `aws_db_instance.main` (Postgres 16, db name `note2action`, master user `n2a_admin`); the five SSM parameters listed in Global Constraints. `DATABASE_URL` uses role `note2action_app` (created later by the RLS migration), `MIGRATIONS_DATABASE_URL` uses the master user.

- [ ] **Step 1: Write rds.tf**

```hcl
resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier             = local.name
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  storage_type           = "gp3"
  db_name                = "note2action"
  username               = "n2a_admin"
  password               = var.db_master_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = false
  publicly_accessible    = false
  backup_retention_period = 1
  skip_final_snapshot    = true
  deletion_protection    = false
}
```

- [ ] **Step 2: Write ssm.tf**

```hcl
locals {
  db_host = aws_db_instance.main.address
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/note2action/database-url"
  type  = "SecureString"
  value = "postgresql+psycopg://note2action_app:${var.app_db_password}@${local.db_host}:5432/note2action"
}

resource "aws_ssm_parameter" "migrations_database_url" {
  name  = "/note2action/migrations-database-url"
  type  = "SecureString"
  value = "postgresql+psycopg://n2a_admin:${var.db_master_password}@${local.db_host}:5432/note2action"
}

resource "aws_ssm_parameter" "app_db_password" {
  name  = "/note2action/app-db-password"
  type  = "SecureString"
  value = var.app_db_password
}

resource "aws_ssm_parameter" "anthropic_api_key" {
  name  = "/note2action/anthropic-api-key"
  type  = "SecureString"
  value = var.anthropic_api_key
}

resource "aws_ssm_parameter" "clerk_jwks_url" {
  name  = "/note2action/clerk-jwks-url"
  type  = "String"
  value = var.clerk_jwks_url
}
```

Append to `infra/outputs.tf`:

```hcl
output "rds_endpoint" {
  value = aws_db_instance.main.address
}
```

- [ ] **Step 3: Apply** (ask Kyle — RDS starts billing ~$14/mo; also registers the $20 RDS credit task)

```bash
terraform -chdir=infra apply
```

Expected: 8 to add; takes ~10 min (RDS creation).

- [ ] **Step 4: Commit** (ask Kyle)

```bash
git add infra/rds.tf infra/ssm.tf infra/outputs.tf
git commit -m "infra: rds postgres 16 (t4g.micro) + ssm secure parameters"
```

---

### Task 7: ECR + first image push

**Files:**

- Create: `infra/ecr.tf`, `scripts/push-images.sh`
- Modify: `infra/outputs.tf`

**Interfaces:**

- Produces: ECR repos `note2action/api` and `note2action/ai`; both `:latest` ARM64 images pushed. Task 10's task definitions reference `${repo_url}:latest`.

- [ ] **Step 1: Write ecr.tf**

```hcl
resource "aws_ecr_repository" "api" {
  name         = "note2action/api"
  force_delete = true
}

resource "aws_ecr_repository" "ai" {
  name         = "note2action/ai"
  force_delete = true
}
```

Append to `infra/outputs.tf`:

```hcl
output "ecr_api_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecr_ai_url" {
  value = aws_ecr_repository.ai.repository_url
}
```

- [ ] **Step 2: Write scripts/push-images.sh**

```bash
#!/usr/bin/env bash
# Build both backend images for linux/arm64 and push :latest to ECR.
set -euo pipefail
cd "$(dirname "$0")/.."

API_REPO=$(terraform -chdir=infra output -raw ecr_api_url)
AI_REPO=$(terraform -chdir=infra output -raw ecr_ai_url)
REGION=$(terraform -chdir=infra output -raw region)

aws ecr get-login-password --region "$REGION" --profile note2action |
  docker login --username AWS --password-stdin "${API_REPO%%/*}"

docker buildx build --platform linux/arm64 -t "$API_REPO:latest" --push apps/api
docker buildx build --platform linux/arm64 --target prod \
  -f apps/ai/Dockerfile -t "$AI_REPO:latest" --push .
```

`chmod +x scripts/push-images.sh`

- [ ] **Step 3: Apply, then push**

```bash
terraform -chdir=infra apply    # 2 to add (ask Kyle; ECR ~free)
./scripts/push-images.sh
aws ecr describe-images --repository-name note2action/api --profile note2action --query 'imageDetails[0].imageTags'
```

Expected: `["latest"]` for both repos.

- [ ] **Step 4: Commit** (ask Kyle)

```bash
git add infra/ecr.tf infra/outputs.tf scripts/push-images.sh
git commit -m "infra: ecr repos + arm64 image push script"
```

---

### Task 8: IAM for task execution

**Files:**

- Create: `infra/iam.tf`

**Interfaces:**

- Produces: `aws_iam_role.task_execution` — used by both task definitions (Task 10). Grants: managed `AmazonECSTaskExecutionRolePolicy` + `ssm:GetParameters` on `/note2action/*`.

- [ ] **Step 1: Write iam.tf**

```hcl
data "aws_caller_identity" "current" {}

resource "aws_iam_role" "task_execution" {
  name = "${local.name}-task-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "task_execution_ssm" {
  name = "read-note2action-params"
  role = aws_iam_role.task_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameters"]
      Resource = "arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/note2action/*"
    }]
  })
}
```

- [ ] **Step 2: Apply** (ask Kyle; free) — `terraform -chdir=infra apply`, expect 3 to add.

- [ ] **Step 3: Commit** (ask Kyle)

```bash
git add infra/iam.tf
git commit -m "infra: ecs task-execution role with scoped ssm read"
```

---

### Task 9: ALB + target groups

**Files:**

- Create: `infra/alb.tf`
- Modify: `infra/outputs.tf`

**Interfaces:**

- Produces: `aws_lb.main`, `aws_lb_target_group.api` (port 8000, health `/api/health`), `aws_lb_target_group.ai` (port 3000, health `/api/health`), listener :80 with header rules — `x-service: api` → api TG, `x-service: ai` → ai TG, default 404. CloudFront (Task 11) sets the `x-service` origin header; nothing without it reaches a service.

- [ ] **Step 1: Write alb.tf**

```hcl
resource "aws_lb" "main" {
  name               = local.name
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "api" {
  name        = "${local.name}-api"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path    = "/api/health"
    matcher = "200"
  }
}

resource "aws_lb_target_group" "ai" {
  name        = "${local.name}-ai"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path    = "/api/health"
    matcher = "200"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "not found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10
  condition {
    http_header {
      http_header_name = "x-service"
      values           = ["api"]
    }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_listener_rule" "ai" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 20
  condition {
    http_header {
      http_header_name = "x-service"
      values           = ["ai"]
    }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ai.arn
  }
}
```

Append to `infra/outputs.tf`:

```hcl
output "alb_dns" {
  value = aws_lb.main.dns_name
}
```

- [ ] **Step 2: Apply** (ask Kyle — ALB starts billing ~$17/mo) — expect 6 to add.

- [ ] **Step 3: Commit** (ask Kyle)

```bash
git add infra/alb.tf infra/outputs.tf
git commit -m "infra: alb with header-routed target groups for api and ai"
```

---

### Task 10: ECS cluster, task definitions, services

**Files:**

- Create: `infra/ecs.tf`

**Interfaces:**

- Consumes: `aws_ecr_repository.api/ai`, `aws_iam_role.task_execution`, `aws_lb_target_group.api/ai`, `aws_security_group.task`, SSM params.
- Produces: cluster `note2action`, task families `note2action-api` / `note2action-ai` (container names `api` / `ai`), services `api` / `ai` (desired 1). The migration one-off (Task 12) and CI (Task 14) reference cluster/family/container names verbatim.

- [ ] **Step 1: Write ecs.tf**

```hcl
resource "aws_ecs_cluster" "main" {
  name = local.name
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.name}-api"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "ai" {
  name              = "/ecs/${local.name}-ai"
  retention_in_days = 14
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.task_execution.arn
  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }
  container_definitions = jsonencode([{
    name      = "api"
    image     = "${aws_ecr_repository.api.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 8000 }]
    environment = [{ name = "REPOSITORY", value = "postgres" }]
    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
      { name = "MIGRATIONS_DATABASE_URL", valueFrom = aws_ssm_parameter.migrations_database_url.arn },
      { name = "CLERK_JWKS_URL", valueFrom = aws_ssm_parameter.clerk_jwks_url.arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.api.name
        awslogs-region        = var.region
        awslogs-stream-prefix = "api"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "ai" {
  family                   = "${local.name}-ai"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.task_execution.arn
  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }
  container_definitions = jsonencode([{
    name      = "ai"
    image     = "${aws_ecr_repository.ai.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3000 }]
    secrets = [
      { name = "ANTHROPIC_API_KEY", valueFrom = aws_ssm_parameter.anthropic_api_key.arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.ai.name
        awslogs-region        = var.region
        awslogs-stream-prefix = "ai"
      }
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8000
  }
}

resource "aws_ecs_service" "ai" {
  name            = "ai"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.ai.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.ai.arn
    container_name   = "ai"
    container_port   = 3000
  }
}
```

- [ ] **Step 2: Apply** (ask Kyle — Fargate starts billing ~$14/mo) — expect 7 to add.

- [ ] **Step 3: Verify targets healthy**

```bash
aws elbv2 describe-target-health --profile note2action \
  --target-group-arn $(terraform -chdir=infra output -raw api_tg_arn 2>/dev/null || aws elbv2 describe-target-groups --names note2action-api --profile note2action --query 'TargetGroups[0].TargetGroupArn' --output text) \
  --query 'TargetHealthDescriptions[].TargetHealth.State'
```

Expected: `["healthy"]` for both TGs (ai may take ~1 min for `next start`). The api service is healthy even though migrations haven't run — `/api/health` touches no DB.

- [ ] **Step 4: Commit** (ask Kyle)

```bash
git add infra/ecs.tf
git commit -m "infra: ecs cluster, arm64 task definitions, alb-wired services"
```

---

### Task 11: S3 + CloudFront

**Files:**

- Create: `infra/cloudfront.tf`, `infra/s3.tf`, `scripts/deploy-web.sh`
- Modify: `infra/outputs.tf`

**Interfaces:**

- Consumes: `aws_lb.main.dns_name`.
- Produces: bucket `note2action-web-<account_id>`, CloudFront distribution with behaviors `/*`→S3(OAC), `/api/*`→ALB(+`x-service: api`), `/ai-api/*`→ALB(+`x-service: ai`, URI rewrite function); output `cloudfront_url`. CI (Task 14) uses bucket name + distribution id.

- [ ] **Step 1: Write s3.tf**

```hcl
resource "aws_s3_bucket" "web" {
  bucket        = "${local.name}-web-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.web.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.main.arn }
      }
    }]
  })
}
```

- [ ] **Step 2: Write cloudfront.tf**

```hcl
resource "aws_cloudfront_origin_access_control" "web" {
  name                              = local.name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "strip_ai_prefix" {
  name    = "${local.name}-strip-ai-prefix"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      request.uri = request.uri.replace(/^\/ai-api/, "/api");
      return request;
    }
  EOT
}

locals {
  s3_origin_id  = "s3-web"
  api_origin_id = "alb-api"
  ai_origin_id  = "alb-ai"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = local.api_origin_id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    custom_header {
      name  = "x-service"
      value = "api"
    }
  }

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = local.ai_origin_id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    custom_header {
      name  = "x-service"
      value = "ai"
    }
  }

  default_cache_behavior {
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # managed CachingOptimized
  }

  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = local.api_origin_id
    viewer_protocol_policy   = "https-only"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # managed CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # managed AllViewer
  }

  ordered_cache_behavior {
    path_pattern             = "/ai-api/*"
    target_origin_id         = local.ai_origin_id
    viewer_protocol_policy   = "https-only"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # managed CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # managed AllViewer
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.strip_ai_prefix.arn
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

Append to `infra/outputs.tf`:

```hcl
output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "web_bucket" {
  value = aws_s3_bucket.web.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.main.id
}
```

- [ ] **Step 3: Write scripts/deploy-web.sh**

```bash
#!/usr/bin/env bash
# Build the SPA and sync dist/ to S3, then invalidate CloudFront.
set -euo pipefail
cd "$(dirname "$0")/.."

BUCKET=$(terraform -chdir=infra output -raw web_bucket)
DIST_ID=$(terraform -chdir=infra output -raw cloudfront_distribution_id)

pnpm --filter @note2action/web build
aws s3 sync apps/web/dist "s3://$BUCKET" --delete --profile note2action
aws cloudfront create-invalidation --distribution-id "$DIST_ID" \
  --paths "/index.html" --profile note2action
```

`chmod +x scripts/deploy-web.sh`

- [ ] **Step 4: Apply** (ask Kyle — CloudFront takes ~5 min) — expect 5 to add. Then `./scripts/deploy-web.sh`.

- [ ] **Step 5: Smoke test**

```bash
URL=$(terraform -chdir=infra output -raw cloudfront_url)
curl -s "$URL/api/health"      # {"status":"ok"} from FastAPI
curl -s "$URL/ai-api/health"   # via rewrite -> ai /api/health -> {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}" "$URL/"   # 200 (SPA index)
```

- [ ] **Step 6: Commit** (ask Kyle)

```bash
git add infra/s3.tf infra/cloudfront.tf infra/outputs.tf scripts/deploy-web.sh
git commit -m "infra: cloudfront front door — s3 spa + header-tagged alb origins"
```

---

### Task 12: Migrations + app-role password on RDS

**Files:**

- Create: `scripts/run-migrations.sh`

**Interfaces:**

- Consumes: cluster `note2action`, family `note2action-api`, container `api` (Task 10); `MIGRATIONS_DATABASE_URL` + `/note2action/app-db-password` SSM param.
- Produces: schema at alembic head; role `note2action_app` exists with the SSM password (the RLS migration creates it with a dev password; step 2's task rotates it).

- [ ] **Step 1: Write scripts/run-migrations.sh**

```bash
#!/usr/bin/env bash
# Run alembic upgrade head as a one-off Fargate task, then rotate the
# note2action_app password from SSM. Fails loudly on non-zero exit.
set -euo pipefail
cd "$(dirname "$0")/.."

PROFILE=note2action
CLUSTER=note2action
SUBNETS=$(terraform -chdir=infra output -json public_subnet_ids | python3 -c 'import json,sys;print(",".join(json.load(sys.stdin)))')
SG=$(terraform -chdir=infra output -raw task_sg_id)

run_task() {
  local overrides=$1
  local arn
  arn=$(aws ecs run-task --profile $PROFILE --cluster $CLUSTER \
    --task-definition note2action-api --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=ENABLED}" \
    --overrides "$overrides" --query 'tasks[0].taskArn' --output text)
  aws ecs wait tasks-stopped --profile $PROFILE --cluster $CLUSTER --tasks "$arn"
  local code
  code=$(aws ecs describe-tasks --profile $PROFILE --cluster $CLUSTER --tasks "$arn" \
    --query 'tasks[0].containers[0].exitCode' --output text)
  [ "$code" = "0" ] || { echo "task failed (exit $code): $arn"; exit 1; }
}

run_task '{"containerOverrides":[{"name":"api","command":["uv","run","--no-dev","alembic","upgrade","head"]}]}'

ROTATE='import os, psycopg
from psycopg import sql
conn = psycopg.connect(os.environ["MIGRATIONS_DATABASE_URL"].replace("postgresql+psycopg", "postgresql"), autocommit=True)
conn.execute(sql.SQL("ALTER ROLE note2action_app WITH PASSWORD {}").format(sql.Literal(os.environ["APP_DB_PASSWORD"])))
print("rotated")'
run_task "{\"containerOverrides\":[{\"name\":\"api\",\"command\":[\"uv\",\"run\",\"--no-dev\",\"python\",\"-c\",$(python3 -c "import json;print(json.dumps('''$ROTATE'''))")]}]}"
```

Note: run-task `--overrides` cannot add secrets; instead add `APP_DB_PASSWORD` to the api task definition's `secrets` list in `infra/ecs.tf` (Task 10 file):

```hcl
      { name = "APP_DB_PASSWORD", valueFrom = aws_ssm_parameter.app_db_password.arn },
```

and add these outputs to `infra/outputs.tf`:

```hcl
output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "task_sg_id" {
  value = aws_security_group.task.id
}
```

`chmod +x scripts/run-migrations.sh`, then `terraform -chdir=infra apply` (task-def revision; ask Kyle).

- [ ] **Step 2: Run it**

```bash
./scripts/run-migrations.sh
```

Expected: both tasks exit 0. CloudWatch `/ecs/note2action-api` shows alembic output ending at `ba1b688e106a` and `rotated`.

- [ ] **Step 3: Verify the app can query**

```bash
URL=$(terraform -chdir=infra output -raw cloudfront_url)
curl -s -o /dev/null -w "%{http_code}" "$URL/api/items"
```

Expected: `401` (auth required — proves FastAPI reached the DB layer, not a 5xx).

- [ ] **Step 4: Commit** (ask Kyle)

```bash
git add scripts/run-migrations.sh infra/ecs.tf infra/outputs.tf
git commit -m "infra: one-off migration task + app-role password rotation"
```

---

### Task 13: Budgets

**Files:**

- Create: `infra/budgets.tf`

**Interfaces:**

- Produces: three absolute cost budgets alerting `var.budget_email` at $50, $120, $180 actual spend. Earns the $20 Budgets credit task.

- [ ] **Step 1: Write budgets.tf**

```hcl
resource "aws_budgets_budget" "credit_burn" {
  for_each     = { fifty = 50, onetwenty = 120, oneeighty = 180 }
  name         = "${local.name}-${each.key}"
  budget_type  = "COST"
  limit_amount = each.value
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_email]
  }
}
```

- [ ] **Step 2: Apply** (ask Kyle; free) — expect 3 to add. Confirm the subscription email arrives.

- [ ] **Step 3: Commit** (ask Kyle)

```bash
git add infra/budgets.tf
git commit -m "infra: spend alarms at 50/120/180 usd"
```

---

### Task 14: GitHub OIDC + deploy workflow

**Files:**

- Create: `infra/iam-github.tf`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: everything — ECR repo names, cluster/service names, migration script, bucket/distribution outputs.
- Produces: role `note2action-github-deploy` assumable only from `main` of `var.github_repo`; `deploy` job in `ci.yml` runs on `main` pushes after the `web` and `api` gates pass.

- [ ] **Step 1: Write iam-github.tf**

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_deploy" {
  name = "${local.name}-github-deploy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_deploy" {
  name = "deploy"
  role = aws_iam_role.github_deploy.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability", "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload", "ecr:PutImage", "ecr:UploadLayerPart",
          "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer",
        ]
        Resource = [aws_ecr_repository.api.arn, aws_ecr_repository.ai.arn]
      },
      {
        Effect = "Allow"
        Action = ["ecs:UpdateService", "ecs:DescribeServices", "ecs:DescribeTasks", "ecs:RunTask"]
        Resource = "*"
        Condition = { ArnEquals = { "ecs:cluster" = aws_ecs_cluster.main.arn } }
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [aws_iam_role.task_execution.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket", "s3:PutObject", "s3:DeleteObject", "s3:GetObject"]
        Resource = [aws_s3_bucket.web.arn, "${aws_s3_bucket.web.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = [aws_cloudfront_distribution.main.arn]
      },
    ]
  })
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}
```

- [ ] **Step 2: Apply** (ask Kyle; free), note the role ARN output.

- [ ] **Step 3: GitHub repo settings (manual)**

Repo → Settings → Secrets and variables → Actions → **Variables**: `AWS_DEPLOY_ROLE_ARN` (from output), `AWS_REGION` = `us-east-1`, `WEB_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID` (from terraform outputs), `VITE_CLERK_PUBLISHABLE_KEY` (Clerk dashboard, `pk_test_...`).

- [ ] **Step 4: Add the deploy job to .github/workflows/ci.yml**

Append this job to the existing `ci.yml` (spec: deploy runs only after the existing CI gates, `main` only). Also add `permissions: { id-token: write, contents: read }` at the workflow's top level.

```yaml
deploy:
  name: Deploy to AWS
  needs: [web, api]
  if: github.ref == 'refs/heads/main'
  concurrency: deploy
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
        aws-region: ${{ vars.AWS_REGION }}
    - uses: aws-actions/amazon-ecr-login@v2
      id: ecr
    - uses: docker/setup-qemu-action@v3
    - uses: docker/setup-buildx-action@v3

    - name: Build and push api image
      run: |
        docker buildx build --platform linux/arm64 \
          -t ${{ steps.ecr.outputs.registry }}/note2action/api:latest \
          --push apps/api

    - name: Build and push ai image
      run: |
        docker buildx build --platform linux/arm64 --target prod \
          -f apps/ai/Dockerfile \
          -t ${{ steps.ecr.outputs.registry }}/note2action/ai:latest \
          --push .

    - name: Run migrations
      run: |
        SUBNETS=$(aws ec2 describe-subnets \
          --filters Name=tag:Name,Values='note2action-public-*' \
          --query 'Subnets[].SubnetId' --output text | tr '\t' ',')
        SG=$(aws ec2 describe-security-groups \
          --filters Name=group-name,Values=note2action-task \
          --query 'SecurityGroups[0].GroupId' --output text)
        ARN=$(aws ecs run-task --cluster note2action \
          --task-definition note2action-api --launch-type FARGATE \
          --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=ENABLED}" \
          --overrides '{"containerOverrides":[{"name":"api","command":["uv","run","--no-dev","alembic","upgrade","head"]}]}' \
          --query 'tasks[0].taskArn' --output text)
        aws ecs wait tasks-stopped --cluster note2action --tasks "$ARN"
        CODE=$(aws ecs describe-tasks --cluster note2action --tasks "$ARN" \
          --query 'tasks[0].containers[0].exitCode' --output text)
        test "$CODE" = "0"

    - name: Roll services
      run: |
        aws ecs update-service --cluster note2action --service api --force-new-deployment
        aws ecs update-service --cluster note2action --service ai --force-new-deployment

    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
    - name: Build and publish SPA
      env:
        VITE_CLERK_PUBLISHABLE_KEY: ${{ vars.VITE_CLERK_PUBLISHABLE_KEY }}
      run: |
        pnpm install --frozen-lockfile
        pnpm --filter @note2action/web build
        aws s3 sync apps/web/dist "s3://${{ vars.WEB_BUCKET }}" --delete
        aws cloudfront create-invalidation \
          --distribution-id ${{ vars.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/index.html"
```

- [ ] **Step 5: Commit + verify** (ask Kyle)

```bash
git add infra/iam-github.tf .github/workflows/ci.yml
git commit -m "infra: github oidc deploy role + ci deploy job"
```

Push the branch, open PR, merge (Kyle's call); watch the `Deploy` run go green on `main`.

---

### Task 15: End-to-end verification + Clerk wiring

**Files:** none (manual checklist).

- [ ] **Step 1: Clerk dev instance**

Clerk dashboard → the dev instance → ensure the CloudFront URL is an allowed origin (dev instances allow all origins by default — only act if sign-in errors mention origins).

- [ ] **Step 2: Full pipeline test**

Open `terraform -chdir=infra output -raw cloudfront_url`: sign in via Clerk → Capture → paste sample notes → **Extract** → items appear in Review → Save to Tasks → refresh page → data persists (RDS round-trip).

- [ ] **Step 3: Log check**

CloudWatch → `/ecs/note2action-api` and `/ecs/note2action-ai`: one clean request trail for the extract call, no errors.

- [ ] **Step 4: Spend check**

Billing → Credits shows $200 earned; Cost Explorer daily spend ≈ $1.5/day. Diarize teardown date (~4 months out): `terraform -chdir=infra destroy`.
