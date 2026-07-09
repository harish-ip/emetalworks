variable "project_name" {
  description = "Project identifier used in IAM role names."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)."
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name — used as prefix for IAM role names."
  type        = string
}

# ── Day 4 inputs (leave at defaults until EKS module is implemented) ──────────

variable "oidc_issuer_url" {
  description = <<-EOT
    EKS cluster OIDC issuer URL WITHOUT the https:// prefix.
    Example: oidc.eks.ap-south-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE
    Set from module.eks.oidc_provider_url on Day 4.
    Leave empty ("") on Day 3 — the aws_iam_openid_connect_provider resource is
    count-gated and will not be created.
  EOT
  type        = string
  default     = ""
}

variable "oidc_thumbprint_list" {
  description = <<-EOT
    TLS thumbprint(s) of the OIDC issuer's root CA certificate.
    AWS EKS automatically manages these in newer regions; for ap-south-1 the
    current Amazon root CA thumbprint is documented in the EKS user guide.
    Provide as a list of 40-character hex strings (no colons).
  EOT
  type        = list(string)
  default     = ["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"] # Amazon root CA 1
}
