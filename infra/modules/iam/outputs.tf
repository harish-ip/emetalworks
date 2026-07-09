# Outputs consumed by the eks module (cluster_role_arn, node_role_arn)
# and by IRSA role creation on Day 11+.

output "cluster_role_arn" {
  description = "ARN of the IAM role assumed by the EKS control plane."
  value       = aws_iam_role.cluster.arn
}

output "node_role_arn" {
  description = "ARN of the IAM role assumed by EC2 worker nodes."
  value       = aws_iam_role.node.arn
}

output "oidc_provider_arn" {
  description = <<-EOT
    ARN of the OIDC identity provider — required to build IRSA trust policies.
    Empty string on Day 3 (provider not yet created); populated from Day 4 onward.
  EOT
  value       = length(aws_iam_openid_connect_provider.this) > 0 ? aws_iam_openid_connect_provider.this[0].arn : ""
}
