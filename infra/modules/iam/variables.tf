variable "project_name" {
  description = "Project identifier used in IAM role names."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)."
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name — used to scope IAM policies to this cluster."
  type        = string
}

# Populated in Day 3 once the EKS module (and its OIDC provider) exists.
# Wired as: oidc_provider_arn = module.eks.oidc_provider_arn
variable "oidc_provider_arn" {
  description = "ARN of the EKS OIDC provider — required for IRSA role creation."
  type        = string
  default     = "" # leave empty until EKS module is implemented (Day 3)
}

variable "oidc_provider_url" {
  description = "URL of the EKS OIDC provider (without https://) — used in IAM trust policies."
  type        = string
  default     = "" # leave empty until EKS module is implemented (Day 3)
}
