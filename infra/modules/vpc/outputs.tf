# Outputs consumed by the eks module and the root env.

output "vpc_id" {
  description = "ID of the created VPC."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs (tagged for ALB / internet-facing load balancers)."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs (tagged for internal load balancers)."
  value       = aws_subnet.private[*].id
}
