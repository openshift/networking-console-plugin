---
name: hot-cluster-prepare
description: >-
  Prepare an OpenShift cluster as a hot cluster for networking-console-plugin
  E2E testing: ARC controller, runner scale set with the custom image,
  runner RBAC/SCC, ci-env-controller with the ci-test-stack chart, and
  verification. Use when the user says /hot-cluster-prepare and gives a
  cluster API URL, console URL, or kubeconfig path.
disable-model-invocation: true
---

# Hot cluster prepare

Turn a bare OpenShift cluster into a hot cluster that runs
`hot-cluster-e2e.yml` via ARC self-hosted runners for
networking-console-plugin.

## Inputs

The user supplies (or the agent infers from context):

- **KUBECONFIG path** or cluster URL — cluster-admin access required
  (kubeadmin kubeconfig from the install dir works:
  `~/rhos-psi.cnv-qe.rhood.us/<cluster>/auth/kubeconfig`)
- **GitHub repo URL** to register runners against (default
  `https://github.com/lkladnit/networking-console-plugin`; the upstream
  `openshift/` repo needs a PAT with the `runners` fine-grained permission
  or repo admin — registration-token API returns 403 otherwise)
- **GitHub token** (default: `gh auth token` from the authenticated gh CLI)

## Procedure

Run everything with `KUBECONFIG` exported and `oc`/`helm` on PATH.
Work from the repo root. Steps are scripted in
`scripts/prepare-hot-cluster.sh`; invoke it:

```bash
KUBECONFIG=<path> GITHUB_CONFIG_URL=<repo-url> GITHUB_TOKEN=$(gh auth token) \
  bash .claude/skills/hot-cluster-prepare/scripts/prepare-hot-cluster.sh
```

The script is idempotent — re-running upgrades/patches rather than failing
on existing resources. What it does, in order:

### 1. ARC controller (namespace `arc-systems`)

- `oc apply` the `github-arc` SCC (from the script; adapted from
  kubevirt-plugin's `ci-scripts/hot-cluster/arc/arc-openshift-scc.yaml`:
  non-root, unprivileged, `runAsUser: MustRunAsNonRoot`)
- Helm install `gha-runner-scale-set-controller` chart **0.14.0** from
  `oci://ghcr.io/actions/actions-runner-controller-charts` with
  `serviceAccount.name=arc-gha-rs-controller`

### 2. Runner namespace (`arc-runners`) and secrets

- `quay-pull` docker-registry secret built from the local podman/skopeo
  authfile (`~/.config/containers/auth.json`, entry `quay.io`) — the
  runner image and per-run plugin images live in the private
  `quay.io/rhn_support_lkladnit` namespace
- `github-token` opaque secret (the runner-registration PAT)

### 3. Runner scale set `networking-console-plugin-ci`

Helm install `gha-runner-scale-set` (same OCI repo, 0.14.0) with:

- `serviceAccountName: arc-runner-sa` (create the SA first)
- image `quay.io/rhn_support_lkladnit/networking-console-plugin-arc-runner:latest`
  (prebuilt by `.github/workflows/build-arc-runner-image.yml`)
- `imagePullSecrets: [quay-pull]`, `maxRunners: 2`, `minRunners: 0`
- pod template volumes: `work`/`npm-cache`/`npm-tmp` emptyDirs only

**Do NOT mount a projected SA-token volume at `/tmp/kubeconfig`.** The
`setup-kubeconfig` composite action writes its kubeconfig file at exactly
that path; a volume mount there makes it a directory and the job dies with
`/tmp/kubeconfig: Is a directory`. The action reads the standard automount
at `/var/run/secrets/kubernetes.io/serviceaccount/` — no custom volume
needed.

### 4. SCC + RBAC for the runner SA

Three bindings, all load-bearing (each fixed a real failure):

- `oc adm policy add-scc-to-user github-arc -z arc-runner-sa -n arc-runners`
  — without it, runner pods are rejected:
  `runAsUser: 1001 must be in the ranges: [1000800000, 1000809999]`
- `oc apply -f ci-scripts/arc-runner-networking-rbac.yaml`, then **patch
  the ClusterRoleBinding subject** to `arc-runner-sa` (the manifest's
  default subject `networking-console-plugin-ci-gha-rs-no-permission`
  doesn't match the SA we set in the chart)
- ClusterRole `arc-runner-ns-admin` + binding: namespaces, configmaps,
  secrets, SAs, pods/logs, services, routes, deployments, jobs,
  NAD/UDN/CUDN, ingresses — needed by `ci-env-request`,
  `setup-test-namespaces`, and `test-cleanup.sh`

### 5. ci-env-controller (namespace `ci-env`)

- Copy `quay-pull` into `ci-env` (the controller copies it into each test
  namespace so plugin pods can pull the private image)
- Build the controller image **in-cluster** via a binary BuildConfig:
  UBI9-minimal + bash/tar/gzip + oc + helm, with the `ci-test-stack`
  chart **unpacked at `/charts/ci-test-stack`** (the controller script
  calls `helm install /charts/ci-test-stack` — a `.tgz` there fails with
  `path "/charts/ci-test-stack" not found`). Build context is generated
  into a temp dir; see the script for the exact Dockerfile
- `helm install ci-env-controller ./ci-scripts/helm/ci-env-controller`
  with `runnerServiceAccount=arc-runner-sa`,
  `runnerServiceAccountNamespace=arc-runners`, `pluginPullSecret=quay-pull`

### 6. Verify

- `ARC_RUNNERS_NS=arc-runners bash ci-scripts/check-cluster-health.sh`
  must print `All checks passed`
- `gh api repos/<owner>/<repo>/actions/runners` must list the scale set's
  runner (appears once the listener connects; count is 0 while idle is
  normal — check the listener pod `Running` in `arc-systems`)
- End-to-end proof: `gh workflow run hot-cluster-e2e.yml --ref main -f
test_spec=tests/all.cy.ts` and confirm all three jobs reach
  `Run E2E Tests: in_progress` with Cypress executing on the runner pod

## Failure modes seen in the wild

| Symptom                                                                                              | Cause                                                                | Fix                                                                                            |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| EphemeralRunner `Failed`, pod `Forbidden ... runAsUser: 1001 must be in ranges [1000800000,...]`     | OpenShift SCC UID ranges vs runner's fixed UID 1001                  | step 4 SCC bind                                                                                |
| Job log: `line 19: /tmp/kubeconfig: Is a directory`                                                  | projected volume mounted at the kubeconfig path                      | step 3 — remove the volume                                                                     |
| Controller log: `Error: INSTALLATION FAILED: path "/charts/ci-test-stack" not found`                 | chart packed as tgz in the image                                     | step 5 — unpack in image                                                                       |
| `oc get ephemeralrunners` shows `Failed: unable to validate against any security context constraint` | SCC not yet bound when jobs dispatched                               | re-bind SCC, delete failed ephemeralrunners; the listener rescales automatically               |
| Runner never registers on GitHub (0 runners, listener silent)                                        | PAT lacks registration rights for the target repo                    | use a PAT with `runners` fine-grained permission or run against a repo where the user is admin |
| Helm: `failed to download openapi` / `context deadline exceeded` on `/openapi/v2`                    | OpenShift OpenAPI schema download exceeds Helm's ~32s client timeout | script uses `--disable-openapi-validation` on all `helm upgrade` calls                         |

## Reversibility

Teardown of everything this skill creates:

```bash
helm uninstall networking-console-plugin-ci -n arc-runners
helm uninstall ci-env-controller -n ci-env
helm uninstall arc -n arc-systems
oc delete ns arc-runners ci-env arc-systems --wait=false
oc delete clusterrolebinding arc-runner-networking arc-runner-ns-admin system:openshift:scc:github-arc
oc delete clusterrole arc-runner-networking arc-runner-ns-admin system:openshift:scc:github-arc
oc delete scc github-arc
oc delete is,bc ci-env-controller -n ci-env --ignore-not-found
```

Test environments created per run are reaped by the controller's
`reapAfterMinutes` (default 120) or the `ci-env-release` action.
