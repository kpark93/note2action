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
