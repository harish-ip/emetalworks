# VPC module — implemented in Day 2.
#
# Will create:
#   • 1 VPC
#   • 2 public subnets across 2 AZs  (kubernetes.io/role/elb tag for ALB discovery)
#   • 2 private subnets across 2 AZs  (kubernetes.io/role/internal-elb tag)
#   • 1 Internet Gateway
#   • Route tables for public and private subnets
#   • 1 NAT Gateway (single, not one-per-AZ) when enable_nat = true
#
# Cost note (ap-south-1, 2026 pricing):
#   NAT gateway:  ~$32/month always-on; $0 when enable_nat = false
#   VPC/subnets:  free
#
# Placeholder — prevents `terraform validate` from failing on empty module.
locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
