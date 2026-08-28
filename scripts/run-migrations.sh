#!/usr/bin/env bash
# Run alembic upgrade head as a one-off Fargate task, then rotate the
# note2action_app password from SSM. Fails loudly on non-zero exit.
set -euo pipefail
cd "$(dirname "$0")/.."

PROFILE=note2action
CLUSTER=note2action
SUBNETS=$(terraform -chdir=infra output -json app_subnet_ids | python3 -c 'import json,sys;print(",".join(json.load(sys.stdin)))')
SG=$(terraform -chdir=infra output -raw task_sg_id)

run_task() {
  local overrides=$1
  local arn
  arn=$(aws ecs run-task --profile $PROFILE --cluster $CLUSTER \
    --task-definition note2action-api --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=DISABLED}" \
    --overrides "$overrides" --query 'tasks[0].taskArn' --output text)
  aws ecs wait tasks-stopped --profile $PROFILE --cluster $CLUSTER --tasks "$arn"
  local code
  code=$(aws ecs describe-tasks --profile $PROFILE --cluster $CLUSTER --tasks "$arn" \
    --query 'tasks[0].containers[0].exitCode' --output text)
  [ "$code" = "0" ] || { echo "task failed (exit $code): $arn"; exit 1; }
}

echo "running alembic upgrade head..."
run_task '{"containerOverrides":[{"name":"api","command":["uv","run","--no-dev","alembic","upgrade","head"]}]}'

echo "rotating note2action_app password..."
ROTATE='import os, psycopg
from psycopg import sql
conn = psycopg.connect(os.environ["MIGRATIONS_DATABASE_URL"].replace("postgresql+psycopg", "postgresql"), autocommit=True)
conn.execute(sql.SQL("ALTER ROLE note2action_app WITH PASSWORD {}").format(sql.Literal(os.environ["APP_DB_PASSWORD"])))
print("rotated")'
run_task "{\"containerOverrides\":[{\"name\":\"api\",\"command\":[\"uv\",\"run\",\"--no-dev\",\"python\",\"-c\",$(python3 -c "import json;print(json.dumps('''$ROTATE'''))")]}]}"

echo "done"
