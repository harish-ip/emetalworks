# EKS module — implemented in Day 4.
#
# Will create:
#   • aws_eks_cluster  (control plane)
#   • aws_eks_node_group  (managed, SPOT capacity, t3.medium, min 1 / max 2)
#   • aws_iam_openid_connect_provider  (OIDC provider for IRSA)
#
# Spot vs on-demand:
#   Spot t3.medium in ap-south-1 ≈ $0.008/hr vs $0.0416/hr on-demand (~80% saving).
#   Risk: 2-min termination notice.  EKS managed node groups handle re-scheduling
#   automatically.  Acceptable for dev; use on-demand for prod critical workloads.
#
# Control-plane logging:
#   Off by default (enable_cluster_logging = false) to avoid CloudWatch ingestion
#   costs (~$0.50/GB).  Enable for debugging; disable after.
#
# Placeholder — prevents `terraform validate` from failing on empty module.
locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
