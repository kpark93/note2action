terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Shared team state: private versioned bucket, S3-native locking. The
  # bucket itself is bootstrapped outside Terraform (chicken-and-egg).
  backend "s3" {
    bucket       = "note2action-tfstate-803881282655"
    key          = "note2action/terraform.tfstate"
    region       = "us-east-1"
    profile      = "note2action"
    use_lockfile = true
  }
}
