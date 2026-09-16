# Hot-Cluster Preparation Guide

Step-by-step guide to prepare an OpenShift (RHOS) cluster for running Cypress E2E tests
via GitHub Actions with ARC (Actions Runner Controller) self-hosted runners.

## Prerequisites

- `oc` CLI authenticated as cluster-admin on the target cluster
- `helm` v3.x installed locally
- A GitHub Personal Access Token (PAT) with `repo` and `admin:org` scopes
  (create at https://github.com/settings/tokens/new)

## Step 1: Create ARC namespaces

```bash
oc create namespace arc-systems
oc create namespace arc-runners
```

## Step 2: Install ARC controller

```bash
helm install arc \
  --namespace arc-systems \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller
```

Verify:
```bash
oc get pods -n arc-systems
# Should show arc-gha-rs-controller pod Running
```

## Step 3: Configure OpenShift SCC for ARC runners

```bash
cat <<'EOF' | oc apply -f -
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  name: arc-runner-scc
allowPrivilegedContainer: false
allowHostDirVolumePlugin: false
allowHostNetwork: false
allowHostPorts: false
allowHostPID: false
allowHostIPC: false
runAsUser:
  type: RunAsAny
seLinuxContext:
  type: RunAsAny
fsGroup:
  type: RunAsAny
supplementalGroups:
  type: RunAsAny
volumes:
  - configMap
  - downwardAPI
  - emptyDir
  - projected
  - secret
EOF
```

## Step 4: Install runner scale set

Replace `YOUR_GITHUB_PAT` with your token. The `githubConfigUrl` should point to the repo
where the workflows live (your fork for testing, upstream for production).

```bash
helm install networking-console-plugin-ci-runner \
  --namespace arc-runners \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set \
  --set githubConfigUrl="https://github.com/lkladnit/networking-console-plugin" \
  --set githubConfigSecret.github_token="YOUR_GITHUB_PAT" \
  --set runnerScaleSetName="networking-console-plugin-ci" \
  --set minRunners=0 \
  --set maxRunners=3 \
  --set-string 'template.spec.containers[0].name=runner' \
  --set-string 'template.spec.containers[0].image=ghcr.io/actions/actions-runner:latest' \
  --set 'template.spec.containers[0].command[0]=/home/runner/run.sh' \
  --set-string 'template.spec.containers[0].env[0].name=OPENSSL_FORCE_FIPS_MODE' \
  --set-string 'template.spec.containers[0].env[0].value=0' \
  --set-string 'template.spec.containers[0].env[1].name=DOTNET_SYSTEM_SECURITY_CRYPTOGRAPHY_USELEGACYPROVIDER' \
  --set-string 'template.spec.containers[0].env[1].value=1'
```

> **FIPS note:** RHOS clusters expose `/proc/sys/crypto/fips_enabled = 1` to all containers.
> The GitHub Actions runner (.NET-based) segfaults without `OPENSSL_FORCE_FIPS_MODE=0`.
> The `oc` CLI (Go-based) panics without `GOLANG_FIPS=0` (set in the workflow, not here).

Grant SCC to the runner service account (created automatically by ARC):

```bash
oc adm policy add-scc-to-user arc-runner-scc \
  system:serviceaccount:arc-runners:networking-console-plugin-ci-gha-rs-no-permission
```

Verify:
```bash
oc get autoscalingrunnersets -n arc-runners
# Should show networking-console-plugin-ci with 0 current runners (idle)

oc get pods -n arc-systems | grep listener
# Should show a listener pod Running
```

## Step 5: Install ci-env-controller

```bash
oc create namespace ci-env

helm install ci-env ./ci-scripts/helm/ci-env-controller \
  --namespace ci-env \
  --set runnerServiceAccount=default \
  --set reapAfterMinutes=120
```

Verify:
```bash
oc get pods -n ci-env
# Should show ci-env-controller pod Running
```

## Step 6: Configure GitHub repo secrets

Set these on the GitHub repo (Settings → Secrets and variables → Actions):

| Secret | Value | Example |
|--------|-------|---------|
| `CLUSTER_API` | Cluster API server URL | `https://api.uit-500-0916.rhos-psi.cnv-qe.rhood.us:6443` |
| `CLUSTER_TOKEN` | Bearer token from `oc whoami --show-token` | `sha256~abc...` |

```bash
# Get the values:
echo "CLUSTER_API: $(oc whoami --show-server)"
echo "CLUSTER_TOKEN: $(oc whoami --show-token)"

# Set via CLI (replace with your fork repo):
gh secret set CLUSTER_API --repo lkladnit/networking-console-plugin \
  --body "$(oc whoami --show-server)"
gh secret set CLUSTER_TOKEN --repo lkladnit/networking-console-plugin \
  --body "$(oc whoami --show-token)"
```

> **Token expiry:** The kubeadmin bearer token does not expire, but if you use a
> different user, the token may have a TTL. Create a long-lived service account
> token for production use.

## Step 7: Run the health check

```bash
bash ci-scripts/check-cluster-health.sh
```

All checks should pass: API server, nodes, ARC runner set, ARC listener, storage class,
console route.

## Step 8: Trigger the workflow

The `hot-cluster-e2e.yml` workflow must exist on the repo's default branch to be
dispatchable. For testing on a fork:

```bash
# Temporarily set your test branch as default
gh api repos/lkladnit/networking-console-plugin -X PATCH -f default_branch=ocpnetui-56

# Trigger
gh workflow run hot-cluster-e2e.yml \
  --repo lkladnit/networking-console-plugin \
  --ref ocpnetui-56 \
  -f test_spec="tests/all.cy.ts"

# Restore default branch after triggering
gh api repos/lkladnit/networking-console-plugin -X PATCH -f default_branch=main
```

Monitor: https://github.com/lkladnit/networking-console-plugin/actions

## Switching clusters

To move to a different cluster:

1. `oc login` to the new cluster
2. Run Steps 1–5 on the new cluster
3. Update `CLUSTER_API` and `CLUSTER_TOKEN` secrets (Step 6)
4. Optionally uninstall from old cluster: `helm uninstall networking-console-plugin-ci-runner -n arc-runners`

No workflow file changes needed — the `runs-on: networking-console-plugin-ci` label routes
jobs to whichever cluster has the runner scale set registered.

## Troubleshooting

**Runner pods segfault (exit code 139):**
FIPS cluster. Ensure `OPENSSL_FORCE_FIPS_MODE=0` is set on the runner pods (Step 4).

**`oc` panics with "opensslcrypto: can't enable FIPS mode":**
`GOLANG_FIPS=0` must be set in the workflow env (already done in `hot-cluster-e2e*.yml`).

**KUBECONFIG permission denied:**
Runner runs as non-root. `KUBECONFIG=/tmp/kubeconfig` is set in workflows.

**oc not found on runner:**
The workflow downloads `oc` to `$RUNNER_TEMP/oc-bin`. Check the "Install oc CLI" step logs.

**ARC runners cycle without picking up jobs:**
Check `oc get ephemeralrunners -n arc-runners` for error messages. Common cause: SCC not
granted to the runner service account.

**ci-env-controller not provisioning:**
Check logs: `oc logs -n ci-env deployment/ci-env-controller`. Verify the trigger ConfigMap
has label `ci.networking-console-plugin/type=test-environment`.
