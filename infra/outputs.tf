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

output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "web_bucket" {
  value = aws_s3_bucket.web.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.main.id
}
