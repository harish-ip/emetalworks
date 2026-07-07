# Outputs consumed by the root env and by the iam module (OIDC provider).
# Stubs — implemented in Day 4.

output "cluster_name" {
  description = "EKS cluster name."
  value       = var.cluster_name
}

output "cluster_endpoint" {
  description = "API server endpoint URL."
  value       = "" # replaced in Day 4
}

output "cluster_certificate_authority_data" {
  description = "Base64-encoded certificate authority data for kubectl."
  value       = "" # replaced in Day 4
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC provider — passed to iam module for IRSA roles."
  value       = "" # replaced in Day 4
}

output "oidc_provider_url" {
  description = "URL of the OIDC provider (without https://)."
  value       = "" # replaced in Day 4
}

output "kubeconfig_command" {
  description = "aws eks update-kubeconfig command for this cluster."
  value       = "aws eks update-kubeconfig --name ${var.cluster_name} --region <aws_region>"
}
