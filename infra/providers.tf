provider "aws" {
  region  = var.region
  profile = "note2action"
  default_tags {
    tags = { project = "note2action", managed_by = "terraform" }
  }
}

locals {
  name = "note2action"
}
