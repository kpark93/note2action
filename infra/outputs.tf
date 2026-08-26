output "region" {
  value = var.region
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "ecr_api_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecr_ai_url" {
  value = aws_ecr_repository.ai.repository_url
}
