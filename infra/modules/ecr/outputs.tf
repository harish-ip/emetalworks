# Stubs — implemented in Day 5.

output "repository_urls" {
  description = "Map of repository name → ECR URL.  Used by CI to push images."
  value       = {} # replaced in Day 5; will be map(string)
}
