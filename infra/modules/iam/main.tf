# IAM module — implemented in Day 3.
#
# Will create:
#   • EKS cluster role  (AmazonEKSClusterPolicy)
#   • EKS node group role  (AmazonEKSWorkerNodePolicy, AmazonEC2ContainerRegistryReadOnly,
#                           AmazonEKS_CNI_Policy)
#   • OIDC provider  (created by the EKS module; ARN passed back here for IRSA)
#   • IRSA helper pattern  (reusable sub-module / documented example for creating
#                           a role scoped to a specific service account)
#
# Why IRSA over node-level IAM?
#   Node-level IAM grants every pod on the node the same permissions — a
#   compromised pod can reach any AWS API the node can.  IRSA mounts a
#   short-lived, audience-scoped JWT into each pod and lets IAM verify it,
#   so permissions are pod-scoped, not node-scoped.  Zero extra cost.
#
# Placeholder — prevents `terraform validate` from failing on empty module.
locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
