# eMetalWorks — EKS Migration Roadmap

> **Goal:** Migrate eMetalWorks to a production-grade, GitOps-driven EKS platform as a portfolio centerpiece for Senior DevOps/SRE roles.
>
> **Cost strategy:** Entire environment is disposable via Terraform (`apply` to build, `destroy` after each session). Business site stays on Render.com until income situation improves. Target spend: under ₹1,500/month.
>
> **Time budget:** 5–10 hrs/week → ~9 weeks total.

---

## Day 0 — Guardrails (do before anything else)


- [done ] Set AWS billing alarm at ₹1,000 (CloudWatch billing alert + SNS email)
- [done ] Set a second alarm at ₹2,500 as a hard warning
- [done ] Create a dedicated IAM user/role for Terraform (no root usage)
- [done ] Create S3 bucket + DynamoDB table for Terraform remote state
- [done ] Add `.env`, `*.pem`, `*.key`, `terraform.tfstate*` to `.gitignore` (secrets hygiene — no repeat of the SpendWise `.env` commit)

---

## Phase 1 — Terraform foundation (Weeks 1–2)

**Outcome:** `terraform apply` → working EKS cluster in ~20 min. `terraform destroy` → zero cost.

### Tasks
- [ ] Module: `vpc` — 2 public + 2 private subnets across 2 AZs (HA story)
- [ ] Decide NAT strategy: single NAT gateway, or public-subnet nodes with no NAT (cheapest)
- [ ] Module: `eks` — cluster + managed node group, **spot t3.medium**, min 1 / max 2 nodes
- [ ] Module: `ecr` — repos for frontend + API, lifecycle policy (keep last 5 images)
- [ ] Module: `iam` — cluster roles, node roles, OIDC provider for **IRSA**
- [ ] Remote state: S3 backend + DynamoDB state locking
- [ ] Root module wiring + `terraform.tfvars.example`
- [ ] Test full cycle: `apply` → verify `kubectl get nodes` → `destroy`

### Suggested repo layout
```
infra/
├── modules/
│   ├── vpc/
│   ├── eks/
│   ├── ecr/
│   └── iam/
├── envs/
│   └── dev/
│       ├── main.tf
│       ├── variables.tf
│       ├── backend.tf
│       └── terraform.tfvars.example
└── README.md
```

### Interview talking points from this phase
- Why IRSA over node-level IAM permissions
- Spot vs on-demand tradeoffs; how to handle spot interruptions
- Remote state + locking; why local state fails for teams

---

## Phase 2 — App on EKS (Weeks 3–4)

**Outcome:** eMetalWorks (React frontend + Node/Express API) reachable through an ALB.

### Tasks
- [ ] Verify/tune existing Dockerfiles (multi-stage builds, non-root user, small base images)
- [ ] Push images to ECR (manual first; CI automates in Phase 3)
- [ ] Manifests: `Deployment` for frontend + API with resource requests/limits
- [ ] Liveness + readiness probes on both services
- [ ] `HorizontalPodAutoscaler` for the API
- [ ] `Service` (ClusterIP) for both
- [ ] Install AWS Load Balancer Controller (Helm)
- [ ] `Ingress` → ALB, path routing: `/` → frontend, `/api` → API
- [ ] Point API at **MongoDB Atlas free tier** (no in-cluster Mongo on spot nodes)
- [ ] Store Mongo URI in Kubernetes `Secret` (sealed-secrets or SOPS optional stretch)

### Suggested repo layout addition
```
k8s/
├── base/
│   ├── frontend/
│   ├── api/
│   └── ingress.yaml
└── overlays/
    ├── dev/
    └── prod/
```

### Interview talking points
- Requests vs limits; what happens without them (noisy neighbor, OOMKill)
- Liveness vs readiness vs startup probes
- Why external managed DB instead of StatefulSet on spot

---

## Phase 3 — GitOps with Argo CD (Weeks 5–6)

**Outcome:** Merge a PR → new version live with zero manual steps.

### Tasks
- [ ] Split repos: **app repo** (code + Dockerfile + CI) and **config repo** (Kustomize overlays)
- [ ] GitHub Actions workflow: lint → Vitest unit tests → Playwright E2E → build image → push to ECR
- [ ] CI final step: commit new image tag to config repo (yq/kustomize edit)
- [ ] Install Argo CD on cluster (Helm, managed by Terraform or bootstrap script)
- [ ] Argo `Application` pointing at config repo, auto-sync + self-heal enabled
- [ ] Demo: manual `kubectl edit` on a deployment → watch Argo revert it (drift detection)
- [ ] Document the pull-based model in README (CI never touches the cluster)

### Interview talking points
- Push vs pull deployment models; why pull is more secure
- App-of-apps pattern (mention, even if not implemented)
- Sync waves, self-heal, drift detection

---

## Phase 4 — Observability & SRE (Weeks 7–8)

**Outcome:** Golden-signals dashboard + SLO-based alerts, all GitOps-managed.

### Tasks
- [ ] Install `kube-prometheus-stack` via Helm — through Argo CD (monitoring is GitOps'd too)
- [ ] Install Loki + Promtail via Helm (also through Argo CD)
- [ ] Instrument the Node API: `prom-client` metrics endpoint (latency histogram, request counter, error counter)
- [ ] Grafana dashboard: four golden signals for the API (latency, traffic, errors, saturation)
- [ ] Define 2–3 SLOs, e.g. "99% of price-calculator requests < 300ms over 7 days"
- [ ] PrometheusRule alerts tied to SLO burn rate
- [ ] Log correlation demo: trace one failed request from Grafana panel → Loki logs

### Interview talking points
- SLI vs SLO vs SLA; error budgets
- Burn-rate alerting vs simple threshold alerting
- Metrics vs logs vs traces; when each is the right tool

---

## Phase 5 — Polish & narrative (Week 9)

**Outcome:** A repo that interviews for you.

### Tasks
- [ ] Architecture diagram in README (VPC → EKS → Argo → observability)
- [ ] **Cost engineering section**: monthly breakdown, spot savings, up/down workflow — senior signal
- [ ] Short screen recording: commit → CI → Argo sync → Grafana shows the deploy
- [ ] Written postmortem of one real issue hit during the build (incident-style: impact, timeline, root cause, remediation)
- [ ] Resume bullet drafts referencing this project (quantified where possible)
- [ ] LinkedIn post / blog write-up (optional, good visibility)

---

## Working agreement (cost discipline)

1. **Never leave the cluster running overnight.** End every session with `terraform destroy` (or a `make down`).
2. `make up` / `make down` targets in a Makefile so spin-up is one command.
3. Check the billing dashboard every Sunday.
4. If a month trends past ₹1,500 — stop, find the leak (usually NAT gateway or a forgotten ALB), fix before continuing.

## Progress log

| Date | Session focus | Hours | Notes |
|------|---------------|-------|-------|
|      |               |       |       |
