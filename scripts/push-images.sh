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
