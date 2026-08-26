output "region" {
  value = var.region
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}
