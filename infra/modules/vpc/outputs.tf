# Outputs consumed by the eks module and the root env.
# Stubs — implemented in Day 2.

output "vpc_id" {
  description = "ID of the created VPC."
  value       = "" # replaced in Day 2
}

output "public_subnet_ids" {
  description = "List of public subnet IDs (tagged for ALB / internet-facing load balancers)."
  value       = [] # replaced in Day 2
}

output "private_subnet_ids" {
  description = "List of private subnet IDs (tagged for internal load balancers)."
  value       = [] # replaced in Day 2
}
