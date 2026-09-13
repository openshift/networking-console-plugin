# RHOS Cluster Preparation for Hot Cluster CI Testing

This guide walks through setting up a RHOS (Red Hat OpenShift Service) cluster for hot-cluster E2E testing with the networking-console-plugin.

## Prerequisites

- RHOS cluster (e.g., `uit-500-0916.rhos-psi.cnv-qe.rhood.us`) with `cluster-admin` access
- `oc` CLI installed and authenticated
- `helm` 3.10+ installed
- GitHub organization/user with repo and Actions enabled
- Valid GitHub PAT token (for ARC authentication)

## Architecture Overview

The hot-cluster CI testing uses:
1. **Actions Runner Controller (ARC)** — self-hosted GitHub Actions runners on Kubernetes
2. **ci-env-controller** — custom controller that provisions test environments via Helm
3. **ci-test-stack** — Helm chart deploying the OpenShift console and plugin
4. **Mounted ServiceAccount tokens** — ARC runners authenticate to the cluster via in-pod KUBECONFIG

## Step 1: Create ARC Namespaces

Create the required namespaces for ARC:

```bash
oc create namespace arc-systems
oc create namespace arc-runners
```

## Step 2: Install Actions Runner Controller (ARC)

Add the ARC Helm repository:

```bash
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller
helm repo update
```

Install ARC in the `arc-systems` namespace:

```bash
helm install arc actions-runner-controller/actions-runner-controller \
  --namespace arc-systems \
  --create-namespace \
  --set authSecret.create=true \
  --wait
```

## Step 3: Create GitHub App Secret

ARC requires a GitHub App or PAT token to authenticate. Create a secret in the `arc-systems` namespace:

```bash
# Option A: Using a GitHub PAT token (simpler for testing)
oc create secret generic github-token \
  --from-literal=github_token="ghp_YOUR_GITHUB_PAT_TOKEN" \
  -n arc-systems

# Option B: Using a GitHub App (recommended for production)
# See: https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/authenticating-to-the-runner-controller
```

## Step 4: Configure OpenShift SCC for ARC Runners

The runner pods need elevated privileges to run Cypress tests and manage Kubernetes resources.

Create a SCC for ARC runners:

```bash
cat <<'EOF' | oc create -f -
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  name: arc-runner-scc
allowHostDirVolumePlugin: false
allowHostIPC: false
allowHostNetwork: false
allowHostPID: false
allowHostPorts: false
allowPrivilegedContainer: false
allowedCapabilities:
  - NET_BIND_SERVICE
  - SETFCAP
  - SETGID
  - SETUID
  - SYS_CHROOT
defaultAddCapabilities: null
forbiddenSysctls:
  - 'kernel.msg*'
  - 'kernel.shm*'
  - 'kernel.sem'
  - 'fs.inotify.*'
fsGroup:
  type: RunAsAny
readOnlyRootFilesystem: false
requiredDropCapabilities: null
runAsUser:
  type: RunAsAny
seLinuxContext:
  type: RunAsAny
supplementalGroups:
  type: RunAsAny
volumes:
  - '*'
EOF
```

Grant the SCC to the ARC runner service account:

```bash
oc adm policy add-scc-to-user arc-runner-scc \
  -z arc-runner-sa \
  -n arc-runners
```

## Step 5: Install ARC Runner Scale Set

Create a `RunnerScaleSet` to provision self-hosted runners for your repository:

```bash
cat <<'EOF' | oc create -f -
apiVersion: actions.summerwind.dev/v1alpha1
kind: RunnerScaleSet
metadata:
  name: networking-console-plugin-ci
  namespace: arc-runners
spec:
  runnerImage: ghcr.io/actions/actions-runner:latest
  runnerScaleSetName: networking-console-plugin-ci
  maxRunners: 2
  minRunners: 0
  runnerGroup: default
  githubConfigUrl: https://github.com/YOUR_OWNER/networking-console-plugin
  githubConfigSecret:
    name: github-token
    key: github_token
  containerMode:
    type: kubernetes
  template:
    spec:
      serviceAccountName: arc-runner-sa
      securityContext:
        fsGroup: 1001
        runAsUser: 1001
      containers:
        - name: runner
          image: ghcr.io/actions/actions-runner:latest
          imagePullPolicy: IfNotPresent
          env:
            - name: OPENSSL_FORCE_FIPS_MODE
              value: '0'
            - name: GOLANG_FIPS
              value: '0'
          volumeMounts:
            - name: kubeconfig
              mountPath: /tmp/kubeconfig
              readOnly: true
      volumes:
        - name: kubeconfig
          projected:
            sources:
              - serviceAccountToken:
                  path: token
                  audience: https://kubernetes.default.svc
              - configMap:
                  name: kube-root-ca.crt
                  items:
                    - key: ca.crt
                      path: ca.crt
            defaultMode: 0600
EOF
```

Create the service account for runners:

```bash
oc create serviceaccount arc-runner-sa -n arc-runners
```

## Step 6: Grant ClusterRole to Runner ServiceAccount

The runners need to access Kubernetes resources (create/delete namespaces, manage networking resources, etc.).

Create and bind a ClusterRole:

```bash
cat <<'EOF' | oc create -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: arc-runner-cluster-role
rules:
  # Namespaces
  - apiGroups: ['']
    resources: ['namespaces']
    verbs: ['get', 'create', 'delete', 'list', 'watch']
  # ConfigMaps
  - apiGroups: ['']
    resources: ['configmaps']
    verbs: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete']
  # Pods, Services, Deployments, etc.
  - apiGroups: ['']
    resources: ['pods', 'services', 'endpoints']
    verbs: ['get', 'list', 'watch']
  - apiGroups: ['apps']
    resources: ['deployments', 'statefulsets']
    verbs: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete']
  # NetworkAttachmentDefinitions
  - apiGroups: ['k8s.cni.cncf.io']
    resources: ['network-attachment-definitions']
    verbs: ['*']
  # User Defined Networks
  - apiGroups: ['k8s.ovn.org']
    resources: ['user-defined-networks', 'cluster-user-defined-networks']
    verbs: ['*']
  # NetworkPolicies
  - apiGroups: ['networking.k8s.io']
    resources: ['networkpolicies']
    verbs: ['*']
  - apiGroups: ['k8s.cni.cncf.io']
    resources: ['multi-network-policies']
    verbs: ['*']
  # ClusterRole and ClusterRoleBindings
  - apiGroups: ['rbac.authorization.k8s.io']
    resources: ['clusterroles', 'clusterrolebindings']
    verbs: ['get', 'list', 'watch', 'create', 'update', 'patch']
  # Events
  - apiGroups: ['']
    resources: ['events']
    verbs: ['get', 'list', 'watch']
EOF

oc create clusterrolebinding arc-runner-binding \
  --clusterrole=arc-runner-cluster-role \
  --serviceaccount=arc-runners:arc-runner-sa
```

## Step 7: Install ci-env-controller

The `ci-env-controller` is a custom Kubernetes controller that reconciles test environments (creates and tears down pods, namespaces, etc.) on demand.

Clone the repository and install the controller:

```bash
cd /path/to/networking-console-plugin

# Install the controller via Helm
helm install ci-env-controller ./ci-scripts/helm/ci-env-controller \
  --namespace ci-env \
  --create-namespace \
  --wait
```

Verify the controller is running:

```bash
oc get pods -n ci-env
```

## Step 8: Configure GitHub Secrets (Optional)

With in-pod ServiceAccount token mounting, GitHub secrets are optional. However, you may optionally add the following secrets for debugging or alternative authentication:

- `CLUSTER_API`: The OpenShift cluster API URL (e.g., `https://api.uit-500-0916.rhos-psi.cnv-qe.rhood.us:6443`) — defaults to `https://kubernetes.default.svc` if not set
- `CLUSTER_TOKEN`: A long-lived token for the runner's service account — only used if manual authentication is needed

**How It Works**: The hot-cluster workflows automatically:
1. Detect the mounted ServiceAccount token at `/var/run/secrets/kubernetes.io/serviceaccount/token`
2. Detect the CA certificate at `/var/run/secrets/kubernetes.io/serviceaccount/ca.crt`
3. Generate a kubeconfig file at `${KUBECONFIG}` that references these files
4. Authenticate all `oc` and `kubectl` commands using the in-pod token

This eliminates the need to manage secrets for cluster authentication and is the recommended approach for ARC runners running in-pod.

## Step 9: Run Health Check

Verify the cluster is ready:

```bash
oc get nodes
oc get namespace arc-runners
oc get pods -n arc-runners
oc get pods -n ci-env
```

Check that the runner pods are registered in GitHub Actions:

```bash
gh api repos/YOUR_OWNER/networking-console-plugin/actions/runners
```

## Triggering Hot Cluster E2E Tests

With the cluster prepared, trigger E2E tests via GitHub Actions:

1. **Via UI**: Go to Actions → "Hot Cluster E2E" → "Run workflow" → select branch and optional test spec
2. **Via CLI**:
   ```bash
   gh workflow run hot-cluster-e2e.yml \
     --repo YOUR_OWNER/networking-console-plugin \
     --ref main \
     -f test_spec="tests/all.cy.ts"
   ```

## Troubleshooting

### Runner pods not starting

Check the ARC controller logs:

```bash
oc logs -f deployment/arc-systems-actions-runner-controller -n arc-systems
```

### Runner not registered in GitHub

Verify the GitHub token secret:

```bash
oc get secret github-token -n arc-systems -o jsonpath='{.data.github_token}' | base64 -d | head -c 50
```

### Networking tests failing

Check console and plugin pod logs:

```bash
oc logs -f -l app=console -n networking-ci-test-*
oc logs -f -l app=plugin -n networking-ci-test-*
```

### FIPS-related errors

FIPS-enabled clusters may require disabling FIPS checks:

```bash
# In the runner container template (RunnerScaleSet):
env:
  - name: OPENSSL_FORCE_FIPS_MODE
    value: '0'
  - name: GOLANG_FIPS
    value: '0'
```

This is already configured in Step 5.

## References

- [Actions Runner Controller Docs](https://github.com/actions/actions-runner-controller)
- [Kubernetes Projected Volumes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-projected-volume/)
- [OpenShift Security Context Constraints](https://docs.openshift.com/latest/authentication/managing-security-context-constraints.html)
