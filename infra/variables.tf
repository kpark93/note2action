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
