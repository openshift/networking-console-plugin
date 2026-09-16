---
name: prep-ci-hot-cluster
description: >-
  Check and prepare a RHOS OpenShift cluster for hot-cluster CI testing of
  networking-console-plugin. Installs ARC, runner scale set, ci-env-controller,
  creates long-lived SA, sets GitHub secrets. Use when the user says
  "prepare cluster", "set up hot cluster", "prep ci cluster", or provides
  a new cluster URL/credentials for CI testing.
---

# Prepare RHOS Cluster for Hot-Cluster CI

## Inputs

Collect from user before starting:
- **Console URL** or **API URL** (e.g. `https://console-openshift-console.apps.CLUSTER.rhos-psi.cnv-qe.rhood.us`)
- **Kubeadmin password**
- **GitHub PAT** — read from `$GITHUB_PAT` env var. If unset, ask the user to provide one or set it: `export GITHUB_PAT=ghp_...`
- **Fork repo** — default `lkladnit/networking-console-plugin`

Derive API URL from console URL: replace `console-openshift-console.apps.` with `api.` and append `:6443`.

## Execution

Run all steps sequentially. Stop and report on any failure.

### 1. Login and verify

```bash
oc login https://api.CLUSTER:6443 --username kubeadmin --password PASSWORD --insecure-skip-tls-verify
oc get clusterversion version -o jsonpath='{.status.desired.version}'
oc get nodes --no-headers | wc -l
```

### 2. Create namespaces

```bash
oc create namespace arc-systems
oc create namespace arc-runners
oc create namespace ci-env
```

### 3. Install ARC controller

```bash
helm install arc --namespace arc-systems \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller
```

Verify: `oc get pods -n arc-systems` shows controller Running.

### 4. Create SCC

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

### 5. Install runner scale set

FIPS workaround required — RHOS clusters have FIPS enabled, causing .NET segfault.

```bash
helm install networking-console-plugin-ci-runner \
  --namespace arc-runners \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set \
  --set githubConfigUrl="https://github.com/FORK_REPO" \
  --set githubConfigSecret.github_token="${GITHUB_PAT}" \
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

Then grant SCC — wait 10s for SA to be created:

```bash
sleep 10
oc adm policy add-scc-to-user arc-runner-scc \
  system:serviceaccount:arc-runners:networking-console-plugin-ci-gha-rs-no-permission
```

### 6. Create long-lived ServiceAccount

Kubeadmin tokens expire ~24h. Create a 1-year SA token instead:

```bash
oc create sa hot-cluster-ci -n default
oc adm policy add-cluster-role-to-user cluster-admin system:serviceaccount:default:hot-cluster-ci
TOKEN=$(oc create token hot-cluster-ci -n default --duration=8760h)
```

### 7. Set GitHub secrets

```bash
gh secret set CLUSTER_API --repo FORK_REPO --body "$(oc whoami --show-server)"
gh secret set CLUSTER_TOKEN --repo FORK_REPO --body "$TOKEN"
```

### 8. Install ci-env-controller

```bash
helm install ci-env ./ci-scripts/helm/ci-env-controller \
  --namespace ci-env \
  --set runnerServiceAccount=default \
  --set reapAfterMinutes=120
```

### 9. Health check

```bash
bash ci-scripts/check-cluster-health.sh
```

Expected: all checks pass. StorageClass warning is OK (not needed for networking tests).

## Verification summary

Print a table at the end:

| Component | Status |
|-----------|--------|
| OCP version | (from step 1) |
| Nodes | (count from step 1) |
| ARC controller | Running / Failed |
| Runner scale set | Deployed / Failed |
| SCC granted | Yes / No |
| ci-env-controller | Running / Failed |
| SA token | Created (1yr) / Failed |
| GitHub secrets | Updated / Failed |
| Health check | Passed / Failed |
| NAD CRD | Present / Absent |

Check NAD CRD: `oc get crd network-attachment-definitions.k8s.cni.cncf.io --no-headers 2>/dev/null`

## Token notes

- `OPENSSL_FORCE_FIPS_MODE=0` — fixes .NET runner segfault on FIPS clusters
- `GOLANG_FIPS=0` — fixes `oc` CLI panic (set in workflows, not on runner pods)
- `KUBECONFIG=/tmp/kubeconfig` — non-root runner can't write to `/.kube/`
