# ECR module — implemented in Day 5.
#
# Will create two repositories:
#   • <project>-frontend
#   • <project>-api
#
# Both will have:
#   • image_scanning_configuration { scan_on_push = true }
#   • Lifecycle policy: keep the last N tagged images, expire untagged images
#     after 1 day (prevents unbounded storage growth)
#
# Cost: ECR storage is $0.10/GB/month.  At ~50 MB/image × 5 images × 2 repos
# = ~500 MB → under $0.10/month.
#
# Placeholder — prevents `terraform validate` from failing on empty module.
locals {
  repositories = [
    "${var.project_name}-frontend",
    "${var.project_name}-api",
  ]
}
