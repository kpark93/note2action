resource "aws_ecr_repository" "api" {
  name         = "note2action/api"
  force_delete = true
}

resource "aws_ecr_repository" "ai" {
  name         = "note2action/ai"
  force_delete = true
}
