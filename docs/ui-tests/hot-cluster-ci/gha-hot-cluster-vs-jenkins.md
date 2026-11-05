# Advantages: GitHub Actions + Hot-Cluster CI vs Jenkins Jobs

Context: neither repo actually ran plugin E2E on Jenkins — kubevirt-plugin used Prow/openshift-ci
(a Jenkins-like centralized CI) and networking-console-plugin used Prow ci-operator. The
analysis below compares the GHA/hot-cluster model both repos adopted against a typical
centralized Jenkins (or Prow) job setup, which is what the migration replaces in spirit.

## Why the teams moved

Both migrations share one root cause: the old model provisioned a **fresh cluster per test run**
(Prow job → new AWS cluster → deploy → test → destroy), or ran against shared/stale
environments. Scott Dickerson's CNV-74261 comment frames the requirements: connect to a real
cluster securely, deploy PR-specific builds, run e2e, report results — with a self-hosted runner
inside/adjacent to the cluster as the preferred variation. The odh-dashboard cypress workflow he
linked is the same pattern.

## Advantages of GHA + hot cluster

### 1. Cost & speed

| Dimension     | Jenkins / per-run cluster                                        | GHA + hot cluster                                                                                                                           |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Cluster cost  | Full cluster per run (or oversized shared Jenkins agents)        | One persistent cluster amortized across all runs; ARC runners are pods that scale to zero                                                   |
| Startup time  | Minutes-to-tens-of-minutes cluster provisioning before every run | Runner pod spins up in seconds; test env (namespaces + Helm release) in ~1–6 min via ci-env-controller                                      |
| Feedback loop | Slow → developers batch changes, retests are expensive           | Fast → kubevirt-plugin made E2E a **required blocking check** and could afford auto-retest of the whole pool when main advances (CNV-92616) |

### 2. Process & developer experience

- **PR-native**: checks, statuses, logs, artifacts, comments all live on the GitHub PR. No
  separate Jenkins dashboard/accounts/SSO; clicking a failing check goes straight to the failing
  step with its log. kubevirt-plugin additionally pushed progress narration and phase statuses
  into the PR UI (CNV-92614).
- **Configuration as code in the repo**: workflows and composite actions are reviewed in the
  same PR as the code they test. Jenkins jobs typically live on a master outside the repo
  (job-dsl aside), so CI changes bypass normal review and drift.
- **Rich PR commands**: `/retest-e2e`, `/retest-failed`, `/hold-e2e`, `/test-e2e <suite>`
  (kubevirt-plugin) — re-running one failed suite instead of the whole job. Jenkins equivalents
  require job parameters and a separate UI.
- **Fork-PR friendliness**: `pull_request_target` gates + bot tokens let untrusted fork PRs run
  tests without handing them secrets (CNV-91783, CNV-92380). Jenkins usually needs a trusted
  webhook proxy or manual approval dance.

### 3. Operations & maintenance

- **No CI server to operate**: no Jenkins masters, plugins, upgrade cycles, node agents, or
  capacity planning. ARC is the only self-hosted component — a controller + runner pods on the
  test cluster, installed by Helm.
- **Ephemeral, immutable runners**: every job gets a fresh runner pod; no state accumulation, no
  "works on the agent" drift, no zombie processes. Jenkins agents accumulate state and need
  periodic rebuilding.
- **Runner scaling for free**: ARC scale sets autoscale with queue depth (with per-cluster
  concurrency caps — CNV-92989 — to protect the shared cluster). Jenkins requires agent pool
  management.
- **Ecosystem**: marketplace actions (checkout, cache, upload-artifact, cypress-io/github-action)
  instead of plugin maintenance; dependabot keeps action versions current (both repos do this).

### 4. Test fidelity

- **Persistent, realistic cluster**: tests run repeatedly against a real OpenShift cluster with
  real operators (HCO/CNV in kubevirt-plugin's case), at scale-representative versions — closer
  to production than a throwaway minimal cluster, and it exercises long-lived-cluster behaviors
  (stale resources, upgrades) that per-run clusters never see.
- **Per-run isolation without rebuild cost**: ci-env-controller gives each run its own
  namespaces/Helm release on the shared cluster; isolation approaches per-run-cluster semantics
  at a fraction of the cost.
- **PR-specific plugin builds** deployed to the shared cluster (image → quay/ttl.sh), which was
  one of Scott's stated hard problems ("multi-tenacity test builds") — solved by namespacing +
  cleanup scripts rather than cluster duplication.

### 5. Security

- **No standing cluster credentials in CI secrets** (networking-console-plugin): the runner pod
  authenticates with its mounted ServiceAccount token; GitHub never holds a kubeconfig. Jenkins
  needs credentials bound to jobs, historically a leak-prone surface.
- **Least-privilege by construction**: RBAC scoped to the CI namespace and the CRDs under test;
  audit trail on cluster. kubevirt-plugin went further and replaced Prow/Tide merge automation
  with a bot App whose token is minted per-run.
- GitHub-side: `permissions:` blocks, `persist-credentials: false`, OIDC to cloud providers.

## Trade-offs / what you give up

Honest counterpoints, since the migration isn't free:

- **You now own cluster lifecycle**: the hot cluster must be provisioned, version-pinned,
  monitored for idle, and torn down — kubevirt-plugin needed setup/teardown/auto-teardown
  workflows and a long tail of fixes (VPC teardown safety CNV-98671, stuck golden images,
  floating-IP sweeps, provisioning races #5069). Jenkins jobs "just ran" on shared infra.
- **Shared-cluster contention**: concurrent suites can interfere; requires concurrency caps,
  careful cleanup, and per-namespace isolation discipline. A throwaway cluster is trivially
  isolated.
- **State drift between runs**: leftover CRs from failed runs can poison later tests; both repos
  carry cleanup scripts + sweeps as permanent debt.
- **GitHub coupling**: vendor lock-in to workflow syntax, runner protocol, and Actions
  limits/pricing; an outage of GitHub blocks CI. Jenkins is self-contained.
- **Self-hosted runner security surface**: a compromised workflow can reach the cluster network;
  needs the same hardening as any in-cluster agent (network policy, RBAC, ephemeral runners).
- **Migration cost**: kubevirt-plugin's path (Apr→Nov 2026, ~60 PRs) included rebuilding merge
  automation and migrating Cypress→Playwright — work that only pays off at their PR volume.

## Bottom line

GHA + hot cluster converts a per-run capital cost (cluster build/teardown) into an amortized
shared asset, moves CI configuration into the normal PR review flow, and eliminates the Jenkins
control plane — at the price of owning a persistent cluster and its hygiene. For repos with
steady PR traffic and multi-version matrix needs (kubevirt-plugin), the model proved cheap enough
to make E2E a required merge check. For a smaller plugin (networking-console-plugin), the same
pattern delivered real-cluster E2E with ~11 PRs and no cluster-ops burden, by keeping a single
externally-maintained cluster and leaving gating/merge automation GitHub-native.
