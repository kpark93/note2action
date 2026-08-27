resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = aws_subnet.private[*].id
}

# Demo posture, deliberately: no final snapshot, no deletion protection, 1-day
# backups, auto-minor engine "16" — this stack is teardown-bound (~4mo credit
# runway). Production would flip the first three and pin the engine version.
resource "aws_db_instance" "main" {
  identifier              = local.name
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = "db.t4g.micro"
  allocated_storage       = 20
  storage_type            = "gp3"
  db_name                 = "note2action"
  username                = "n2a_admin"
  password                = var.db_master_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  multi_az                = false
  publicly_accessible     = false
  backup_retention_period = 1
  skip_final_snapshot     = true
  deletion_protection     = false
}
