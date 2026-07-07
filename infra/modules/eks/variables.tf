variable "project_name" {
  description = "Project identifier used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)."
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster."
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version (e.g. \"1.30\").  Pin to a specific minor release."
  type        = string
  default     = "1.30"
}

variable "vpc_id" {
  description = "ID of the VPC where the cluster runs."
  type        = string
}

variable "subnet_ids" {
  description = <<-EOT
    Subnet IDs for the node group.
    Pass public_subnet_ids when enable_nat = false (nodes need direct internet for ECR pulls).
    Pass private_subnet_ids when enable_nat = true.
  EOT
  type        = list(string)
}

variable "cluster_role_arn" {
  description = "IAM role ARN for the EKS control plane (from the iam module)."
  type        = string
}

variable "node_role_arn" {
  description = "IAM role ARN for the worker nodes (from the iam module)."
  type        = string
}

variable "node_instance_type" {
  description = "EC2 instance type for the managed node group."
  type        = string
  default     = "t3.medium"
}

variable "node_min_size" {
  description = "Minimum number of worker nodes."
  type        = number
  default     = 1
}

variable "node_desired_size" {
  description = "Desired number of worker nodes."
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes."
  type        = number
  default     = 2
}

variable "enable_cluster_logging" {
  description = "Enable EKS control-plane log types to CloudWatch (adds cost)."
  type        = bool
  default     = false
}
