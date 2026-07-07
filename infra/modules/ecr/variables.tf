variable "project_name" {
  description = "Project identifier — used to name repositories."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)."
  type        = string
}

variable "image_retention_count" {
  description = "Number of tagged images to keep per repository (lifecycle policy)."
  type        = number
  default     = 5
}
