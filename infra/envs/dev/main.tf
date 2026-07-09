terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Default tags applied to every resource this provider creates.
  # Cost attribution: filter by Project + Environment in the billing console.
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repo        = "github.com/harish-ip/emetalworks"
    }
  }
}

# ── VPC ───────────────────────────────────────────────────────────────────────
# 2 public + 2 private subnets across 2 AZs.
# enable_nat = false → nodes run in public subnets (cheapest; revisit for prod).

module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  cluster_name = var.cluster_name
  vpc_cidr     = var.vpc_cidr
  enable_nat   = var.enable_nat
}

# ── IAM ───────────────────────────────────────────────────────────────────────
# Cluster role, node group role, and (Day 4+) the OIDC provider for IRSA.
#
# Day 3: cluster_role_arn and node_role_arn are created here and passed to the
# eks module below.  oidc_issuer_url is left at its default ("") so the OIDC
# provider resource is not created yet (count = 0).
#
# Day 4: after aws_eks_cluster exists, add:
#   oidc_issuer_url = module.eks.oidc_provider_url
# That flips the OIDC provider from count=0 to count=1 on the next apply.

module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment
  cluster_name = var.cluster_name
  # oidc_issuer_url = module.eks.oidc_provider_url  # uncomment on Day 4
}

# ── EKS ───────────────────────────────────────────────────────────────────────
# Managed node group with SPOT t3.medium, min 1 / max 2 nodes.
# Subnets: public while NAT is disabled; switch to private_subnet_ids when
# enable_nat = true.

module "eks" {
  source = "../../modules/eks"

  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  cluster_name           = var.cluster_name
  cluster_version        = var.cluster_version
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = module.vpc.public_subnet_ids
  node_instance_type     = var.node_instance_type
  node_min_size          = var.node_min_size
  node_desired_size      = var.node_desired_size
  node_max_size          = var.node_max_size
  enable_cluster_logging = var.enable_cluster_logging
  cluster_role_arn       = module.iam.cluster_role_arn
  node_role_arn          = module.iam.node_role_arn
}

# ── ECR ───────────────────────────────────────────────────────────────────────
# Two repositories: emetalworks-frontend and emetalworks-api.
# Lifecycle policy keeps the last N tagged images to control storage costs.

module "ecr" {
  source = "../../modules/ecr"

  project_name          = var.project_name
  environment           = var.environment
  image_retention_count = var.image_retention_count
}

# ── Outputs used by the Makefile ──────────────────────────────────────────────

output "cluster_name" {
  description = "EKS cluster name — used by `make kubeconfig`."
  value       = module.eks.cluster_name
}

output "aws_region" {
  description = "AWS region — used by `make kubeconfig`."
  value       = var.aws_region
}

output "ecr_repository_urls" {
  description = "Map of ECR repository name → URL."
  value       = module.ecr.repository_urls
}

output "kubeconfig_command" {
  description = "Run this command to update your local kubeconfig."
  value       = module.eks.kubeconfig_command
}
