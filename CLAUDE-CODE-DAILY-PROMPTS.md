# eMetalWorks EKS Migration — Day-wise Claude Code Prompts

> **How to use:** One day = one session (2–3 hrs). Paste the day's prompt into Claude Code in VS Code, review the diffs it proposes, run the verification steps, then end the session (`terraform destroy` if the cluster is up).
>
> **Before Day 1:** Keep `EKS-MIGRATION-ROADMAP.md` in the repo root — the prompts reference it so Claude Code has full context.
>
> **Tip:** Start each session with a short context line like "Continue the EKS migration. We completed Day N yesterday." Claude Code reads your files, but stating where you are helps it focus.

---

## Phase 0 — Guardrails

### Day 0 (setup, ~1 hr, mostly manual in AWS Console)
Do the billing alarms and IAM user manually (Claude Code can't click the console for you), then run this prompt:

```
Review my repo's .gitignore and strengthen it for a Terraform + Kubernetes + Node.js project. Ensure it covers: .env and all env variants, *.pem, *.key, terraform.tfstate and backups, .terraform/ directories, crash logs, and kubeconfig files. Then scan the repo history hints (file names only, don't need git history) and flag any file currently tracked that looks like it contains secrets. Show me the diff before applying.
```

**Verify:** `.gitignore` updated; no secret-looking files tracked; billing alarms live at ₹1,000 and ₹2,500.

---

## Phase 1 — Terraform foundation (Days 1–6)

### Day 1 — Scaffold + backend
```
Read EKS-MIGRATION-ROADMAP.md, Phase 1. Create the infra/ directory structure exactly as specified: modules/{vpc,eks,ecr,iam} and envs/dev. In envs/dev, create backend.tf configured for S3 remote state with DynamoDB locking (use placeholder bucket/table names in variables I can fill in), main.tf with empty module blocks wired to the four modules, variables.tf, and terraform.tfvars.example. Add a Makefile at repo root with targets: init, plan, up (apply), down (destroy), and kubeconfig. Pin Terraform >= 1.7 and AWS provider ~> 5.0. Don't implement module internals yet — just clean skeletons with variables.tf, outputs.tf, main.tf in each module.
```
**Verify:** `terraform init` succeeds from `infra/envs/dev` (after creating the S3 bucket/DynamoDB table and filling tfvars).

### Day 2 — VPC module
```
Implement the infra/modules/vpc module. Requirements: 2 public + 2 private subnets across 2 AZs (make AZs data-sourced, not hardcoded), an internet gateway, and route tables. Make NAT gateway optional via a variable enable_nat (default false) — when false, I'll run EKS nodes in public subnets to save cost; when true, create a SINGLE NAT gateway, not one per AZ. Tag all subnets correctly for EKS and ALB discovery (kubernetes.io/role/elb on public, internal-elb on private, cluster shared tags). Output vpc_id, public_subnet_ids, private_subnet_ids. Explain the cost implication of each NAT choice in a comment block at the top of main.tf.
```
**Verify:** `terraform plan` shows sensible resources; subnet tags present in plan output.

### Day 3 — IAM module (IRSA)
```
Implement infra/modules/iam for EKS. Create: the cluster IAM role with required managed policies, the node group role, and the OIDC provider setup for IRSA. Add a reusable sub-pattern (or documented example) for creating an IRSA role scoped to a specific service account, since I'll need one later for the AWS Load Balancer Controller. Add comments explaining WHY IRSA is preferred over node-level permissions — I want to be able to explain this in interviews. Output the role ARNs and OIDC provider ARN.
```
**Verify:** `terraform validate` passes; you can explain IRSA in 2–3 sentences without looking.

### Day 4 — EKS module
```
Implement infra/modules/eks. Requirements: EKS cluster (latest stable version as a variable with a sensible default), one managed node group using SPOT capacity, instance type t3.medium, min 1 / desired 1 / max 2 nodes. Nodes go in the subnets passed in via variable (I'll pass public subnets since NAT is disabled). Enable the cluster to work with IRSA using the OIDC provider from the iam module. Keep control plane logging off by default (cost) but expose it as a variable. Output cluster name, endpoint, and a ready-to-use aws eks update-kubeconfig command string.
```
**Verify:** `terraform plan` on full stack looks right. Don't apply yet.

### Day 5 — ECR + first full apply
```
Implement infra/modules/ecr: two repositories (emetalworks-frontend, emetalworks-api) with image scanning on push enabled and a lifecycle policy keeping only the last 5 images. Then review the entire infra/ stack end to end for errors, missing variable wiring, or circular dependencies. Once clean, walk me through the apply: I'll run make up and paste any errors back to you.
```
**Verify:** `make up` → cluster ACTIVE in ~15–20 min → `kubectl get nodes` shows 1 spot node → **`make down`** and confirm in the console that VPC/EKS/ALB resources are gone.

### Day 6 — Cycle test + docs
```
Yesterday the full stack applied and destroyed successfully. Today: 1) Write infra/README.md documenting the module structure, the up/down workflow, the NAT cost decision, and estimated per-hour running cost of the stack. 2) Add a pre-destroy checklist comment to the Makefile down target (e.g., confirm no orphaned ALBs, since Kubernetes-created load balancers are not in Terraform state and survive destroy — explain this gotcha in the README, it's a classic). 3) Review everything against Phase 1 in EKS-MIGRATION-ROADMAP.md and tick the completed checkboxes.
```
**Verify:** One more full `make up` → `make down` cycle without touching docs. Phase 1 done.

---

## Phase 2 — App on EKS (Days 7–12)

### Day 7 — Dockerfile audit
```
Audit the existing Dockerfiles for the frontend (React 18/Vite) and API (Node.js/Express). Upgrade them to production grade: multi-stage builds, smallest sensible base images (alpine or distroless where safe), non-root user, .dockerignore files, and NODE_ENV=production. For the frontend, serve the built static assets with nginx in the final stage and include a basic nginx.conf with gzip and cache headers. Explain each change in the PR-style summary so I can defend the choices in interviews.
```
**Verify:** Both images build locally; image sizes noticeably smaller than before; containers run as non-root (`docker inspect`).

### Day 8 — Push to ECR + k8s skeleton
```
1) Give me the exact commands to authenticate Docker to ECR and push both images with a v0.1.0 tag (my AWS region and account ID are in infra/envs/dev/terraform.tfvars). 2) Create the k8s/ directory per Phase 2 of EKS-MIGRATION-ROADMAP.md: base/frontend, base/api, and overlays/dev with Kustomize. Just kustomization.yaml files and empty manifest placeholders today — structure only.
```
**Verify:** Both images visible in ECR; `kubectl kustomize k8s/overlays/dev` runs without error (even if output is minimal).

### Day 9 — Deployments + probes
```
Write the Deployment manifests for frontend and API in k8s/base. Requirements: resource requests and limits (frontend: 100m/128Mi requests, 200m/256Mi limits; API: 150m/256Mi requests, 300m/512Mi limits — adjust if you think these are wrong for a Vite static site behind nginx and an Express API, and explain), liveness and readiness probes (add a /healthz endpoint to the Express API if it doesn't exist — implement it in the API code too), and image tags managed via Kustomize images field. Explain the difference between liveness and readiness probes in comments — interview material.
```
**Verify:** API `/healthz` returns 200 locally; manifests pass `kubectl apply --dry-run=client`.

### Day 10 — Services, HPA, Mongo secret
```
1) Add ClusterIP Services for frontend and API. 2) Add an HPA for the API: min 1, max 3, target 70% CPU. 3) I've created a MongoDB Atlas free-tier cluster — create a Kubernetes Secret manifest TEMPLATE for the connection string (with a placeholder, real value applied manually, never committed), update the API Deployment to consume it via env var, and document the manual secret-apply step in k8s/README.md. Make sure nothing secret-like can be committed: check .gitignore covers any local secret files pattern we use.
```
**Verify:** `kubectl kustomize` output shows Services, HPA, and secret ref wiring.

### Day 11 — ALB controller + Ingress
```
1) Using the IRSA pattern from infra/modules/iam, add Terraform for the AWS Load Balancer Controller's IAM role and service account annotations. 2) Add a Helm release for the controller — prefer managing it via Terraform helm_release for now (we'll move it to Argo CD in Phase 3; note this migration in a TODO comment). 3) Write the Ingress manifest: ALB, internet-facing, path routing / → frontend service, /api → API service, with health check annotations pointing at the right paths.
```
**Verify:** `make up`, deploy everything, get the ALB DNS name, load the site in a browser, price calculator works against Atlas. Screenshot it. **`make down`** — and confirm the ALB is actually gone (the gotcha from Day 6: delete the Ingress before destroy).

### Day 12 — Buffer + Phase 2 wrap
```
Review everything built in Phase 2 against the roadmap. Fix anything from my notes below [paste your issues from Day 11 here]. Then: add a k8s/README.md section on the deploy order (secret first, then kustomize apply, then verify), and a teardown order (delete Ingress FIRST so the ALB is removed, then make down). Tick Phase 2 checkboxes in EKS-MIGRATION-ROADMAP.md.
```
**Verify:** Full cycle: `make up` → deploy → site live → teardown in correct order → zero orphaned resources. Phase 2 done.

---

## Phase 3 — GitOps with Argo CD (Days 13–18)

### Day 13 — Repo split
```
Read Phase 3 of EKS-MIGRATION-ROADMAP.md. Plan the split into app repo and config repo. Move the k8s/ directory contents into a structure suitable for a standalone config repo (I'll create the new GitHub repo manually — give me the exact folder layout, kustomization wiring, and a README for it). The app repo keeps: source code, Dockerfiles, and CI workflows. List every cross-reference that breaks in the move and how to fix each.
```
**Verify:** Config repo pushed to GitHub; `kubectl kustomize overlays/dev` works from the new repo.

### Day 14 — CI: build + test
```
Write a GitHub Actions workflow for the app repo: on PR — lint, Vitest unit tests, and Playwright E2E (headless, against a docker-compose'd local stack; reuse existing compose file if suitable). On merge to main — everything above plus build both Docker images tagged with the short git SHA and push to ECR using OIDC-based AWS auth (no long-lived AWS keys in GitHub secrets — set up the GitHub OIDC provider and role in Terraform, add it to infra/modules/iam). Explain the OIDC auth flow in the workflow comments.
```
**Verify:** A test PR runs the workflow green; merge pushes SHA-tagged images to ECR.

### Day 15 — CI: manifest bump
```
Extend the main-branch workflow: after pushing images, check out the config repo (deploy key or PAT — recommend the safer option and set it up), use kustomize edit or yq to update the image tags in overlays/dev to the new SHA, and commit with message "deploy: <app-sha>". This completes the CI half of GitOps: CI never touches the cluster, it only writes to Git.
```
**Verify:** Merge to main → config repo receives an automated commit with the new tag.

### Day 16 — Argo CD install
```
Add Argo CD to the cluster via Terraform helm_release (bootstrap only — Argo manages everything else). Then write the Argo CD Application manifest pointing at my config repo's overlays/dev path, with automated sync, self-heal, and prune enabled. Document how to access the Argo UI via port-forward and how to get the initial admin password.
```
**Verify:** `make up` → Argo installed → Application synced → app running WITHOUT any manual kubectl apply. Leave cluster up for Day 17 if doing back-to-back, else destroy.

### Day 17 — End-to-end GitOps + drift demo
```
Today is demo day, guide me through: 1) Make a tiny visible frontend change (e.g., version string in the footer), open PR, merge. 2) Watch: CI builds → config repo commit → Argo syncs → change is live. Time each stage. 3) Drift detection demo: kubectl edit the API deployment replicas manually, watch Argo revert it. Help me record terminal commands and expected outputs for both demos in docs/gitops-demo.md so I can re-run them cold in an interview.
```
**Verify:** Full commit-to-live pipeline works hands-free; drift reverted automatically. **Destroy.**

### Day 18 — Phase 3 hardening + docs
```
Review the whole GitOps setup: flag any secrets exposure, any step where CI has more permissions than needed (least privilege), and any single point of failure. Write docs/architecture.md covering the pull-based model with a mermaid diagram: developer → PR → CI → ECR + config repo → Argo CD → EKS. Tick Phase 3 checkboxes in the roadmap.
```
**Verify:** Docs render on GitHub with the mermaid diagram. Phase 3 done.

---

## Phase 4 — Observability & SRE (Days 19–23)

### Day 19 — Instrument the API
```
Add prom-client to the Express API: a /metrics endpoint exposing default Node metrics plus custom ones — an HTTP request duration histogram labeled by route and status code, a request counter, and an error counter. Middleware-based so all routes are covered automatically. Include the price-calculator route with its own label since it'll be our SLO target. Add unit tests for the metrics middleware.
```
**Verify:** Local `curl /metrics` shows histograms after hitting a few endpoints; tests pass.

### Day 20 — kube-prometheus-stack via Argo
```
Add kube-prometheus-stack to the config repo as an Argo CD Application (Helm source). Trim default values for a tiny cluster: reduce retention to 2d, small resource requests, disable components we don't need (alertmanager can stay). Add a ServiceMonitor for the API's /metrics endpoint. Document why monitoring-as-GitOps matters (everything reproducible from Git — interview line).
```
**Verify:** `make up` → Argo syncs monitoring → Prometheus targets page shows the API scraped. Destroy or continue.

### Day 21 — Loki + Grafana dashboard
```
1) Add Loki + Promtail to the config repo as Argo Applications (single-binary Loki mode, minimal resources). 2) Create a Grafana dashboard as a ConfigMap (JSON model, sidecar-loaded) with the four golden signals for the API: p50/p95/p99 latency from the histogram, request rate, error rate percentage, and CPU/memory saturation vs limits. Walk me through reading each panel — I need to narrate this dashboard fluently in interviews.
```
**Verify:** Dashboard loads with live data while you click around the site; Loki shows API logs in Grafana Explore.

### Day 22 — SLOs + burn-rate alerts
```
Define SLOs in docs/slo.md: 1) 99% of price-calculator requests complete under 300ms over a rolling 7 days. 2) API availability 99.5% over 7 days. Then implement PrometheusRule resources with multi-window burn-rate alerts (fast burn: 5m/1h windows, slow burn: 30m/6h) for the availability SLO. Explain error budgets and why burn-rate alerting beats static thresholds in the doc — in plain language I can say out loud.
```
**Verify:** Rules loaded in Prometheus; force an alert by killing the API pod repeatedly and watch it fire.

### Day 23 — Log correlation + Phase 4 wrap
```
1) Guide me through a trace-a-failure exercise: cause a 500 in the API (temporary bad route or bad Mongo URI), then walk from the Grafana error-rate panel → to Loki logs filtered to that time window → to the root cause line. I'll write this up. 2) Review Phase 4 against the roadmap and tick checkboxes.
```
**Verify:** You can do metric → log correlation in under 2 minutes unaided. **Destroy.** Phase 4 done.

---

## Phase 5 — Polish & narrative (Days 24–26)

### Day 24 — README + cost engineering
```
Rewrite the root README.md as a portfolio-grade document: what eMetalWorks is (real business context — steel fabrication storefront for Bhavya Fabrication Works), the architecture (embed docs/architecture.md diagram), the GitOps flow, the observability stack, and a Cost Engineering section: itemized monthly estimate for the full stack always-on vs the up/down workflow, spot savings math, the NAT decision. Honest numbers — this section is senior-engineer signal.
```

### Day 25 — Postmortem + demo script
```
1) Help me write docs/postmortem-001.md about [describe the worst issue you actually hit during the build] in proper incident format: summary, impact, timeline, root cause, resolution, lessons, action items. Keep it honest and technical. 2) Create docs/demo-script.md: a 5-minute walkthrough order for showing this project in an interview — what to open, what to say, what to demo live (the drift-detection revert is the showstopper).
```

### Day 26 — Resume bullets + wrap
```
Based on everything in this repo, draft 4-5 resume bullets for a Senior DevOps/SRE application. Rules: start with a strong verb, quantify where honest (deploy time, cost reduction vs always-on, image size reduction from Day 7, pipeline stages), mention the tech precisely (EKS, Argo CD, Terraform, IRSA, Prometheus/Grafana/Loki, GitHub Actions OIDC). Then a 3-sentence project summary for LinkedIn. Finally, tick the last roadmap checkboxes — we're done.
```

**Verify:** A stranger reading only the README understands the project in 3 minutes. Roadmap 100% ticked. 🎯

---

## Session hygiene (every single day)

1. Start: state where you are ("continuing from Day N").
2. Review every diff Claude Code proposes before accepting.
3. End: `make down` if cluster is up → check billing dashboard weekly → update the progress log in EKS-MIGRATION-ROADMAP.md.
