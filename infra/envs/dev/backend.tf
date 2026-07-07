# Remote state — S3 + DynamoDB locking.
#
# Why remote state?  Local state fails for teams: concurrent applies corrupt
# the file, there's no locking, and the file often ends up committed to git
# (where it may contain sensitive values).  S3 + DynamoDB gives us:
#   • A single source of truth stored outside the repo
#   • Atomic locking via DynamoDB so two `apply` runs can't race
#   • Encryption at rest (encrypt = true)
#
# Before running `make init`, fill in the three FILL_IN values below.
# These were created in Day 0 (see EKS-MIGRATION-ROADMAP.md).
#
# NOTE: Terraform does NOT support variable interpolation inside a `backend`
# block — the values must be literals. That's intentional (chicken-and-egg:
# you need the backend configured before you can read variables).

terraform {
  backend "s3" {
    bucket         = "emetalworks-tfstate-658735297348" # e.g. emetalworks-tf-state-123456789012
    key            = "emetalworks/dev/terraform.tfstate"
    region         = "ap-south-1"         # update if your bucket is in a different region
    dynamodb_table = "emetalworks-tflock" # e.g. emetalworks-tf-locks
    encrypt        = true
  }
}
