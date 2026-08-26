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
  type = string
  # GitHub's OIDC sub claim is ID-stamped (owner@id/repo@id) — rename-proof.
  default = "kpark93@306295185/note2action@1330408301"
}
