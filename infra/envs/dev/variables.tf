# ── General ───────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-south-1" # Mumbai — closest to Hyderabad
}

variable "project_name" {
  description = "Short project identifier used in resource names and tags."
  type        = string
  default     = "emetalworks"
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)."
  type        = string
  default     = "dev"
}

# ── Networking ────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat" {
  description = <<-EOT
    When true, creates a single NAT gateway so private-subnet nodes can reach
    the internet.  When false (default), nodes run in public subnets — no NAT
    cost, but nodes have public IPs.  Set true before moving to production.
  EOT
  type        = bool
  default     = false
}

# ── EKS cluster ───────────────────────────────────────────────────────────────

variable "cluster_name" {
  description = "EKS cluster name.  Used in kubeconfig and IAM policies."
  type        = string
  default     = "emetalworks-dev"
}

variable "cluster_version" {
  description = "Kubernetes version.  Pin to a specific minor release for stability."
  type        = string
  default     = "1.30"
}

variable "enable_cluster_logging" {
  description = "Enable EKS control-plane logging to CloudWatch.  Off by default (cost)."
  type        = bool
  default     = false
}

# ── Node group ────────────────────────────────────────────────────────────────

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes.  t3.medium = 2 vCPU / 4 GB."
  type        = string
  default     = "t3.medium"
}

variable "node_min_size" {
  description = "Minimum number of worker nodes."
  type        = number
  default     = 1
}

variable "node_desired_size" {
  description = "Desired number of worker nodes at launch."
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes (for cluster-autoscaler / HPA headroom)."
  type        = number
  default     = 2
}

# ── ECR ───────────────────────────────────────────────────────────────────────

variable "image_retention_count" {
  description = "Number of tagged images to keep per ECR repository (lifecycle policy)."
  type        = number
  default     = 5
}
