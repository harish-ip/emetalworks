# infra/

Terraform code for the eMetalWorks EKS platform.

---

## Structure

```
infra/
├── modules/
│   ├── vpc/    — VPC, subnets, IGW, route tables, optional NAT gateway
│   ├── iam/    — Cluster role, node role, OIDC provider (IRSA)
│   ├── eks/    — EKS cluster + managed SPOT node group
│   └── ecr/    — ECR repositories + lifecycle policies
└── envs/
    └── dev/
        ├── backend.tf              — S3 remote state + DynamoDB locking
        ├── main.tf                 — Provider config + module wiring
        ├── variables.tf            — All input variables with descriptions
        └── terraform.tfvars.example — Copy → terraform.tfvars and fill in
```

---

## First-time setup

### Prerequisites

- Terraform >= 1.7 — [install](https://developer.hashicorp.com/terraform/downloads)
- AWS CLI v2 — [install](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- `kubectl` — [install](https://kubernetes.io/docs/tasks/tools/)
- An IAM user/role with AdministratorAccess (created in Day 0)
- An S3 bucket and DynamoDB table for remote state (created in Day 0)

### One-time configuration

```bash
# 1. Configure backend — fill in your S3 bucket and DynamoDB table
#    (can't use Terraform variables here — backend config must be literals)
vi infra/envs/dev/backend.tf

# 2. Configure variables
cp infra/envs/dev/terraform.tfvars.example infra/envs/dev/terraform.tfvars
vi infra/envs/dev/terraform.tfvars

# 3. Initialise
make init
```

---

## Daily workflow

```bash
# Start of session — spin up everything (~20 min for EKS)
make up

# Update kubectl to point at the new cluster
make kubeconfig

# Verify the cluster is healthy
kubectl get nodes

# ... do your work ...

# END OF EVERY SESSION — destroy to avoid ongoing charges
make down
```

---

## NAT gateway decision

| Config | Cost | Node placement | Use case |
|---|---|---|---|
| `enable_nat = false` (default) | $0/month extra | Public subnets (nodes have public IPs) | Dev/learning — cheapest |
| `enable_nat = true` | ~$32/month | Private subnets | Staging/prod — nodes not directly reachable |

The default is `false` — nodes run in public subnets with direct internet access. This is fine for a dev cluster where cost matters more than the node isolation story.

Change to `true` before any production workload.

---

## Estimated running cost (ap-south-1, always-on)

| Resource | $/hour | $/month |
|---|---|---|
| EKS control plane | $0.10 | ~$73 |
| 1× Spot t3.medium node | ~$0.004 | ~$3 |
| NAT gateway (if enabled) | $0.045 + data | ~$32+ |
| ECR storage (5 images × 2 repos × ~50 MB) | — | < $0.10 |
| S3 state storage | — | < $0.01 |
| **Total (no NAT, 1 spot node)** | | **~$76/month** |
| **Per session (2 hr, no NAT)** | | **~$0.21** |

With the up/down workflow (apply at session start, destroy at end), a 2-hour session costs roughly ₹18. Leave it running overnight and you pay full monthly rate.

---

## Pre-destroy checklist

Before running `make down`, always:

1. **Delete Kubernetes Ingress objects first** — the AWS Load Balancer Controller creates ALBs in response to Ingress resources. Those ALBs live outside Terraform state. If you destroy without deleting the Ingress, the ALB becomes an orphan: you keep paying, and the next `terraform apply` may fail trying to recreate a security group with a conflicting name.

   ```bash
   kubectl delete ingress --all -A
   # Wait ~60 seconds for the ALB to be deprovisioned
   make down
   ```

2. Check for any other Kubernetes-managed AWS resources: EBS volumes from PersistentVolumeClaims, NLBs from `type: LoadBalancer` Services.

---

## Interview talking points

**IRSA vs node-level IAM**
Node-level IAM grants every pod on the node the same AWS permissions. A compromised pod can reach any API the node can. IRSA (IAM Roles for Service Accounts) mounts a short-lived, OIDC-signed JWT into each pod; IAM verifies it against the cluster's OIDC provider and issues credentials scoped to that service account only. Pod-level isolation at zero extra cost.

**Spot interruptions**
AWS gives a 2-minute termination notice via the Instance Metadata Service. EKS managed node groups handle draining automatically on interruption. For stateless workloads (our API) this is acceptable; for stateful workloads use `PodDisruptionBudget` + node affinity to mix spot and on-demand.

**Remote state + locking**
Local state fails for teams: two engineers run `apply` concurrently → state file corruption. S3 stores the canonical state; DynamoDB provides a mutex via `LockID` — a second `apply` blocks until the first releases the lock.
