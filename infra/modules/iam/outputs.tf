# Outputs consumed by the eks module (cluster_role_arn, node_role_arn)
# and by any future IRSA role creation.
# Stubs — implemented in Day 3.

output "cluster_role_arn" {
  description = "ARN of the IAM role assumed by the EKS control plane."
  value       = "" # replaced in Day 3
}

output "node_role_arn" {
  description = "ARN of the IAM role assumed by EC2 worker nodes."
  value       = "" # replaced in Day 3
}
