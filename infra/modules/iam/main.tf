# IAM module — EKS cluster role, node group role, and OIDC provider for IRSA.
#
# ── Why IRSA over node-level IAM? (interview-ready) ──────────────────────────
#
# The old pattern: attach an IAM role to the EC2 node → every pod on that node
# inherits the node's permissions via the instance metadata service (IMDS).
# A single compromised pod can call any AWS API the node is allowed to call.
#
# IRSA (IAM Roles for Service Accounts) breaks that blast radius:
#   1. EKS projects an OIDC-signed JWT into each pod as a volume mount.
#   2. The pod exchanges that JWT with AWS STS using AssumeRoleWithWebIdentity.
#   3. The IAM trust policy checks two OIDC claims: `aud` (must match STS) and
#      `sub` (must match system:serviceaccount:<namespace>:<sa-name>).
#   4. STS returns a short-lived credential scoped only to that role.
#
# Result: pod-level least privilege.  The ALB controller pod gets S3 read; the
# backend pod gets DynamoDB write; a compromised pod cannot escalate to the
# node's broader permissions.  Zero extra cost over the node-role approach.
# This is also required to pass CIS Kubernetes Benchmark control 5.1.5.
#
# ── Circular dependency and creation order ────────────────────────────────────
#
# The OIDC provider needs the cluster's issuer URL, which only exists AFTER the
# EKS cluster is fully created.  So we split across two days:
#
#   Day 3 (this file):
#     • aws_iam_role.cluster    — needed BEFORE cluster creation (passed as input)
#     • aws_iam_role.node       — needed BEFORE node group creation
#
#   Day 4 (EKS module implementation):
#     • aws_eks_cluster is created → issuer URL is known
#     • aws_iam_openid_connect_provider is created (see bottom of this file,
#       gated behind var.oidc_issuer_url != "")
#     • oidc_provider_arn is passed back to iam module (if needed for IRSA roles)
#
# The aws_iam_openid_connect_provider block at the bottom of this file is
# intentionally inert on Day 3 (count = 0 when var.oidc_issuer_url == "").

locals {
  name_prefix = var.cluster_name
}

# ── Cluster role ──────────────────────────────────────────────────────────────
# Assumed by the EKS control plane.  AWS manages the cluster nodes on your
# behalf using this role — it needs to create ENIs, describe EC2 instances, etc.

data "aws_iam_policy_document" "cluster_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cluster" {
  name               = "${local.name_prefix}-cluster-role"
  assume_role_policy = data.aws_iam_policy_document.cluster_assume_role.json

  tags = {
    Name = "${local.name_prefix}-cluster-role"
  }
}

resource "aws_iam_role_policy_attachment" "cluster_policy" {
  role       = aws_iam_role.cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ── Node group role ───────────────────────────────────────────────────────────
# Assumed by the EC2 worker nodes (not the pods — see IRSA section).
# Three managed policies are the minimum EKS requires:
#   • AmazonEKSWorkerNodePolicy       — lets nodes register with the cluster
#   • AmazonEKS_CNI_Policy            — lets the VPC CNI assign pod IPs
#   • AmazonEC2ContainerRegistryReadOnly — lets nodes pull images from ECR

data "aws_iam_policy_document" "node_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  name               = "${local.name_prefix}-node-role"
  assume_role_policy = data.aws_iam_policy_document.node_assume_role.json

  tags = {
    Name = "${local.name_prefix}-node-role"
  }
}

resource "aws_iam_role_policy_attachment" "node_worker" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "node_cni" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "node_ecr" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# ── OIDC provider (Day 4 — wired once EKS cluster exists) ────────────────────
# count = 0 on Day 3 (var.oidc_issuer_url is "").
# On Day 4, the eks module creates the cluster, reads the issuer URL from
# aws_eks_cluster.this.identity[0].oidc[0].issuer, and passes it here.
# The thumbprint list can be retrieved with:
#   curl -s $(ISSUER_URL)/.well-known/openid-configuration \
#     | jq -r .jwks_uri | xargs openssl s_client -connect ... | ...
# AWS also documents the current root CA thumbprint for ap-south-1.
# For simplicity we use the well-known static thumbprint for Amazon's CA.

resource "aws_iam_openid_connect_provider" "this" {
  count = var.oidc_issuer_url != "" ? 1 : 0

  url             = "https://${var.oidc_issuer_url}"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = var.oidc_thumbprint_list

  tags = {
    Name = "${local.name_prefix}-oidc-provider"
  }
}

# ── IRSA role pattern (reusable template — instantiate for each controller) ───
#
# HOW TO USE: copy this block and fill in the four variables.
# Example below is for the AWS Load Balancer Controller (wired on Day 11).
#
# locals {
#   irsa_roles = {
#     alb_controller = {
#       namespace      = "kube-system"
#       sa_name        = "aws-load-balancer-controller"
#       policy_arns    = [aws_iam_policy.alb_controller.arn]
#     }
#   }
# }
#
# data "aws_iam_policy_document" "irsa_assume" {
#   for_each = local.irsa_roles
#
#   statement {
#     effect  = "Allow"
#     actions = ["sts:AssumeRoleWithWebIdentity"]
#
#     principals {
#       type        = "Federated"
#       identifiers = [aws_iam_openid_connect_provider.this[0].arn]
#     }
#
#     condition {
#       # Audience must be STS — prevents token reuse against other AWS services.
#       test     = "StringEquals"
#       variable = "${var.oidc_issuer_url}:aud"
#       values   = ["sts.amazonaws.com"]
#     }
#
#     condition {
#       # Subject must be the exact service account — pod-level least privilege.
#       # Only the pod running as this SA can assume this role.
#       test     = "StringEquals"
#       variable = "${var.oidc_issuer_url}:sub"
#       values   = ["system:serviceaccount:${each.value.namespace}:${each.value.sa_name}"]
#     }
#   }
# }
#
# resource "aws_iam_role" "irsa" {
#   for_each           = local.irsa_roles
#   name               = "${local.name_prefix}-irsa-${each.key}"
#   assume_role_policy = data.aws_iam_policy_document.irsa_assume[each.key].json
# }
#
# resource "aws_iam_role_policy_attachment" "irsa" {
#   for_each   = { for k, v in local.irsa_roles : k => v.policy_arns... }
#   role       = aws_iam_role.irsa[each.key].name
#   policy_arn = each.value
# }
#
# The Kubernetes ServiceAccount must carry the matching annotation:
#   annotations:
#     eks.amazonaws.com/role-arn: <aws_iam_role.irsa["alb_controller"].arn>
