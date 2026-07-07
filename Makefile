# eMetalWorks infrastructure Makefile
#
# Usage:
#   make init       — initialise Terraform and download providers
#   make plan       — show what would change (dry-run)
#   make up         — apply: create / update all infrastructure (~20 min for EKS)
#   make down       — destroy ALL infrastructure (run at end of every session)
#   make kubeconfig — update ~/.kube/config to point at the cluster
#
# Cost discipline (from EKS-MIGRATION-ROADMAP.md):
#   Never leave the cluster running overnight.
#   End every session with:  make down
#   Check billing every Sunday.

ENV_DIR := infra/envs/dev

# Read cluster name and region from Terraform outputs after `make up`.
# If the cluster doesn't exist yet, these will be empty strings — that's fine.
CLUSTER_NAME := $(shell terraform -chdir=$(ENV_DIR) output -raw cluster_name 2>/dev/null)
AWS_REGION   := $(shell terraform -chdir=$(ENV_DIR) output -raw aws_region   2>/dev/null)

.PHONY: init plan up down kubeconfig

## Initialise Terraform — downloads providers, configures S3 backend.
## Run once per checkout (or after adding a new provider).
init:
	terraform -chdir=$(ENV_DIR) init

## Show execution plan without making any changes.
plan:
	terraform -chdir=$(ENV_DIR) plan

## Apply: create or update all infrastructure.
## EKS cluster takes ~15-20 minutes to become ACTIVE.
up:
	terraform -chdir=$(ENV_DIR) apply -auto-approve

## Destroy ALL infrastructure.
##
## ⚠  IMPORTANT — run this pre-destroy checklist FIRST:
##   1. Delete Kubernetes Ingress resources:
##        kubectl delete ingress --all -A
##      Reason: the AWS Load Balancer Controller creates ALBs in response to
##      Ingress objects.  Those ALBs are NOT tracked in Terraform state
##      (they're created by the controller, not by tf directly).
##      If you run `terraform destroy` without deleting the Ingress first,
##      the ALB will be left behind as an orphan, and you'll keep paying for it.
##   2. Confirm no other Kubernetes-managed AWS resources exist
##      (EBS volumes from PVCs, NLBs from LoadBalancer Services, etc.)
##   3. Then run:  make down
##
down:
	terraform -chdir=$(ENV_DIR) destroy -auto-approve

## Update ~/.kube/config to talk to the EKS cluster.
## Run this after `make up` to configure kubectl.
kubeconfig:
	@if [ -z "$(CLUSTER_NAME)" ]; then \
	  echo "❌  cluster_name output is empty — has 'make up' completed successfully?"; \
	  exit 1; \
	fi
	aws eks update-kubeconfig \
	  --name   $(CLUSTER_NAME) \
	  --region $(AWS_REGION)
	@echo "✅  kubectl is now configured for cluster: $(CLUSTER_NAME)"
