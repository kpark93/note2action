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
