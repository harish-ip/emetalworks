variable "project_name" {
  description = "Project identifier used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC (e.g. 10.0.0.0/16)."
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat" {
  description = <<-EOT
    Create a single NAT gateway for private-subnet internet access.
    Cost: ~$32/month.  false = no NAT, nodes run in public subnets.
  EOT
  type        = bool
  default     = false
}
