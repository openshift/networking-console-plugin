# Design & Implementation Differences — kubevirt-plugin vs networking-console-plugin Hot-Cluster CI

Both projects run E2E tests on a persistent ("hot") OpenShift cluster using GitHub Actions with
ARC (Actions Runner Controller) self-hosted runners. The networking-console-plugin work
(OCPNETUI-56) explicitly mirrors the kubevirt-plugin model (CNV-74265) — PR #581 is a follow-up
to Gal Kremer's review — but the two implementations differ in nearly every layer above the
runner itself.

## Summary matrix

| Aspect               | kubevirt-plugin (CNV-74265 / CNV-97362)                                                                                                                   | networking-console-plugin (OCPNETUI-56)                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cluster provisioning | In-repo: `ibmc-cluster-setup.yml` on IBM Cloud (classic ROKS / VPC ROKS / IPI), with CCO manual-mode creds, VPC security groups, DNS cleanup, HCO install | **None in-repo** — a single externally-maintained OpenShift cluster                                                                                                           |
| Cluster teardown     | In-repo: manual teardown, cron auto-teardown (2h idle via GitHub API idle detection), cleanup-all                                                         | None — cluster persists; only per-run test envs are torn down                                                                                                                 |
| Clusters             | Multiple, per-release (`kubevirt-plugin-XY`) with version-specific ARC runner labels                                                                      | Single shared cluster, single runner label `networking-console-plugin-ci`                                                                                                     |
| Test engine          | Playwright (migrated off Cypress; Cypress support removed Nov 2026)                                                                                       | Cypress (`cypress-io/github-action@v7`) — chosen by epic CNV-87983 to match the upstream repos' existing infra, with tests rewritten from cnv-qe/kubevirt-ui Playwright specs |
| Trigger model        | PR-gated: `pull_request_target` thin gates dispatch `hot-cluster-e2e.yml`; required "Run Gating Tests" check blocks merge                                 | `workflow_dispatch` only (manual); `e2e.yml` on PRs runs only if `CONSOLE_URL` secret set                                                                                     |
| Merge automation     | Full Prow/Tide replacement in GHA: `/lgtm` `/approve` `/hold`, OWNERS, merge pool, auto-merge gate, needs-rebase                                          | Standard GitHub branch protection (unchanged)                                                                                                                                 |
| Plugin image         | podman build → quay.io (bot account)                                                                                                                      | podman build `Dockerfile.ci` (public UBI9 bases) → quay.io personal repo `rhn_support_lkladnit`, idempotent via skopeo inspect                                                |
| Console under test   | Version-appropriate console resolved per cluster; in-cluster ImageStream build with retry (HPP manifests)                                                 | `ci-test-stack` Helm chart resolves console image from the cluster's OCP version; off-cluster bridge Deployment                                                               |
| Test-env isolation   | ci-env-request → ci-env-controller → ci-test-stack (in-cluster Helm controller watching ConfigMaps)                                                       | Same pattern (directly ported): ci-env-request → ci-env-controller → ci-test-stack                                                                                            |
| Cluster auth         | GitHub secrets (`IC_KEY`, ARC GitHub App/PAT, `OPENSHIFT_PULL_SECRET`); kubeconfig materialized in jobs                                                   | **In-pod ServiceAccount token + CA** via `setup-kubeconfig` composite action — no CLUSTER_API/CLUSTER_TOKEN GitHub secrets                                                    |
| Runner image         | Default ARC runner + in-job tool bootstrap                                                                                                                | **Custom pre-baked ARC runner image** (`Dockerfile.arc-runner`: oc, helm, skopeo, node, Cypress cache)                                                                        |
| Retest/UX commands   | Rich PR command set: `/retest-e2e`, `/retest-failed`, `/hold-e2e`, `/test-e2e` (ad-hoc suites), progress commit-statuses, phase narration                 | Manual re-dispatch from Actions UI; `/hot-cluster-e2e-failures` local skill builds HTML failure reports                                                                       |
| Pipeline code        | Shared TypeScript infra in `.github/scripts/` (merge pool SSOT, dispatchers)                                                                              | Shell scripts + composite actions (`ci-scripts/`, `.github/actions/`)                                                                                                         |
| Scale of change      | ~60 PRs over ~6 months (Apr–Nov 2026), incl. full Cypress→Playwright migration and Prow replacement                                                       | ~11 PRs over ~3 months (Aug–Nov 2026), focused on infra + coverage                                                                                                            |
| Reporting            | PR comments (ad-hoc suite results), gating check, e2e-passed/failed labels, videos kept for failures                                                      | mochawesome/JUnit report artifact, screenshots artifact, diagnostics bundle, HTML report via local skill                                                                      |

## Where the designs diverge — and why

### 1. Cluster lifecycle ownership

kubevirt-plugin owns its clusters end-to-end because it must test against **many OpenShift/CNV
versions** (release branches 4.12→4.21 each pin HCO/CNV channels). That forced: setup/teardown
workflows, three infrastructure types (classic/VPC/IPI — IPI avoids the ROKS management fee but
adds pull-secret, CIS DNS, and CCO credential burden), golden images, idle-based auto-teardown,
and a large fraction of the follow-up tickets (teardown deleting live VPCs, stuck golden images,
orphan floating-IP sweeps).

networking-console-plugin tests **one plugin against one console version on one cluster** — the
cluster is a given. That removes the entire lifecycle class of problems and kept the change an
order of magnitude smaller.

### 2. Gating vs manual

kubevirt-plugin made hot-cluster E2E a **required check** and rebuilt merge automation in GHA
after dropping Prow/Tide — a substantial subsystem (`/lgtm` semantics, merge pool, label trust,
auto-retest on main advance). networking-console-plugin kept GitHub-native branch protection and
left the hot-cluster workflow manual-dispatch only; its PR-level `e2e.yml` degrades gracefully
(no-op without the `CONSOLE_URL` secret). This is the biggest functional gap if OCPNETUI-56 is
meant to reach parity.

### 3. Credential handling

kubevirt-plugin stores cloud + ARC App secrets in GitHub and writes kubeconfigs into jobs.
networking-console-plugin's `setup-kubeconfig` derives credentials from the runner pod's mounted
ServiceAccount token — the runner is in-cluster, so no cluster credentials ever live in GitHub.
Cleaner security posture; only possible because there's exactly one trusted cluster.

### 4. Console deployment

kubevirt-plugin builds console images in-cluster (ImageStream + retry, HPP manifest downloads).
networking-console-plugin deploys an **off-cluster console bridge** (`ci-test-stack`) that talks
to the host cluster with a ServiceAccount token, exposed via an edge-TLS Route — the controller
picks the console image matching the cluster's OCP version. Simpler, and it isolates the console
from the cluster's own console operator.

### 4a. Test-engine divergence (deliberate, not drift)

The two repos ended on opposite engines by explicit decisions, not accident. networking-console-
plugin chose **Cypress** because parent epic CNV-87983 dictated "use Cypress to match existing
upstream infra" when migrating the Playwright specs out of `cnv-qe/kubevirt-ui` — the repo
already had a dormant Cypress scaffold since 2022. kubevirt-plugin moved the **other way**
(Cypress→Playwright, completed Nov 2026) for its own reasons at scale. Net effect: the ported
CI infra is engine-agnostic (ci-env-controller/ci-test-stack just deliver a `BRIDGE_BASE_ADDRESS`),
which is exactly what allowed the same pattern to carry a different engine per repo.

### 5. Runner tooling

kubevirt-plugin bootstraps tools per job; networking-console-plugin pre-bakes them into a custom
ARC runner image (PR #580) — trading image-maintenance for per-run startup time. The reverse
choice in kubevirt-plugin is defensible given per-release runner scale sets would each need the
image maintained.

### 6. Ported components (deliberately the same)

- `ci-env-request` / `ci-env-release` composite actions and the `ci-env-controller` +
  `ci-test-stack` Helm pattern (ConfigMap-triggered, `desired-state: present/absent`,
  `status: ready` + bridge URL) are direct ports of kubevirt-plugin's design.
- ARC runner scale set labeled per repo (`kubevirt-plugin-ci` ↔ `networking-console-plugin-ci`).
- Plugin image built from PR code and pushed to a registry the cluster can pull.

## Convergence notes

- Both ended with tests running against a persistent cluster via ARC, per-run namespace
  isolation, and image-build-from-PR.
- kubevirt-plugin later replaced Cypress with Playwright; networking-console-plugin still
  standardizes on Cypress (and is adding a fixture-based, cluster-less integration harness in
  OCPNETUI-228 — a direction kubevirt-plugin did not take).
