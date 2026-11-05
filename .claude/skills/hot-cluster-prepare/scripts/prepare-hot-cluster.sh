#!/bin/bash
#
# prepare-hot-cluster.sh — prepare an OpenShift cluster as a hot cluster for
# networking-console-plugin E2E (ARC + ci-env-controller).
#
# Idempotent: upgrades/patches on re-run.
#
# Required environment:
#   KUBECONFIG          cluster-admin kubeconfig
#   GITHUB_CONFIG_URL   repo to register runners against
#   GITHUB_TOKEN        PAT with runner-registration rights for that repo
#
# Optional:
#   RUNNER_IMAGE        (default: quay.io/rhn_support_lkladnit/networking-console-plugin-arc-runner:latest)
#   SCALE_SET_NAME      (default: networking-console-plugin-ci)
#   MAX_RUNNERS         (default: 2)
#   ARC_VERSION         (default: 0.14.0)
#   QUAY_AUTHFILE       (default: ~/.config/containers/auth.json)
#   SKIP_BUILD_CONTROLLER  set to 1 to skip the in-cluster controller image build
set -euo pipefail

KUBECONFIG="${KUBECONFIG:?KUBECONFIG must point at a cluster-admin kubeconfig}"
GITHUB_CONFIG_URL="${GITHUB_CONFIG_URL:?GITHUB_CONFIG_URL must be the repo URL, e.g. https://github.com/lkladnit/networking-console-plugin}"
GITHUB_TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN must be a PAT that can register runners on the target repo}"

RUNNER_IMAGE="${RUNNER_IMAGE:-quay.io/rhn_support_lkladnit/networking-console-plugin-arc-runner:latest}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
SCALE_SET_NAME="${SCALE_SET_NAME:-networking-console-plugin-ci}"
MAX_RUNNERS="${MAX_RUNNERS:-2}"
ARC_VERSION="${ARC_VERSION:-0.14.0}"
QUAY_AUTHFILE="${QUAY_AUTHFILE:-$HOME/.config/containers/auth.json}"
ARC_HELM_REPO="oci://ghcr.io/actions/actions-runner-controller-charts"
CONTROLLER_SA_NAME="arc-gha-rs-controller"

WORK="$(mktemp -d /tmp/hot-cluster-prepare.XXXXXX)"
trap 'rm -rf "${WORK}"' EXIT

command -v oc >/dev/null || { echo "ERROR: oc not on PATH"; exit 1; }
command -v helm >/dev/null || { echo "ERROR: helm not on PATH"; exit 1; }
oc whoami >/dev/null || { echo "ERROR: oc not authenticated"; exit 1; }

echo "=== Preparing hot cluster: $(oc whoami --show-server) ==="
echo "    runners for: ${GITHUB_CONFIG_URL}"

# ---------------------------------------------------------------- 1. controller
echo "--- [1/6] ARC controller (arc-systems)"
oc create namespace arc-systems --dry-run=client -o yaml | oc apply -f - >/dev/null

cat > "${WORK}/scc.yaml" <<'EOF'
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  name: github-arc
  annotations:
    kubernetes.io/description: 'ARC runners: main container as UID 1001 (Helm), non-root, unprivileged.'
allowHostDirVolumePlugin: false
allowHostIPC: false
allowHostNetwork: false
allowHostPID: false
allowHostPorts: false
allowPrivilegeEscalation: false
allowPrivilegedContainer: false
allowedCapabilities: null
defaultAddCapabilities: null
fsGroup:
  type: RunAsAny
groups: []
priority: null
readOnlyRootFilesystem: false
runAsUser:
  type: MustRunAsNonRoot
seLinuxContext:
  type: MustRunAs
supplementalGroups:
  type: RunAsAny
users: []
volumes:
  - configMap
  - csi
  - downwardAPI
  - emptyDir
  - persistentVolumeClaim
  - projected
  - secret
EOF
oc apply -f "${WORK}/scc.yaml" >/dev/null

# --disable-openapi-validation: OpenShift /openapi/v2 can exceed Helm's
# 32s client timeout on fresh/large clusters (context deadline exceeded).
helm upgrade arc "${ARC_HELM_REPO}/gha-runner-scale-set-controller" \
  --install --namespace arc-systems \
  --set "serviceAccount.name=${CONTROLLER_SA_NAME}" \
  --version "${ARC_VERSION}" --wait --timeout 5m \
  --disable-openapi-validation >/dev/null
oc rollout status deployment/"${CONTROLLER_SA_NAME}" -n arc-systems --timeout=120s >/dev/null

# ------------------------------------------------------------------ 2. secrets
echo "--- [2/6] arc-runners namespace + secrets"
oc create namespace arc-runners --dry-run=client -o yaml | oc apply -f - >/dev/null

[ -f "${QUAY_AUTHFILE}" ] || { echo "ERROR: quay authfile not found at ${QUAY_AUTHFILE}"; exit 1; }
python3 - "${QUAY_AUTHFILE}" <<'EOF' > "${WORK}/dockerconfig.json"
import json, sys
auths = json.load(open(sys.argv[1]))["auths"]
out = {"auths": {"quay.io": auths["quay.io"]}}
print(json.dumps(out))
EOF
if oc get secret quay-pull -n arc-runners >/dev/null 2>&1; then
  oc delete secret quay-pull -n arc-runners >/dev/null
fi
oc create secret docker-registry quay-pull \
  --from-file=.dockerconfigjson="${WORK}/dockerconfig.json" \
  -n arc-runners >/dev/null

if ! oc get secret github-token -n arc-runners >/dev/null 2>&1; then
  oc create secret generic github-token --from-literal=github_token="${GITHUB_TOKEN}" \
    -n arc-runners >/dev/null
fi

# --------------------------------------------------------------- 3. scale set
echo "--- [3/6] runner scale set ${SCALE_SET_NAME} (${RUNNER_IMAGE})"
oc create serviceaccount arc-runner-sa -n arc-runners --dry-run=client -o yaml | oc apply -f - >/dev/null
oc secrets link arc-runner-sa quay-pull --for=pull -n arc-runners 2>/dev/null || true

# NOTE: no /tmp/kubeconfig projected volume here — setup-kubeconfig writes a
# FILE at that path; a mount makes it a directory and breaks the job.
cat > "${WORK}/runner-values.yaml" <<EOF
githubConfigUrl: ${GITHUB_CONFIG_URL}
githubConfigSecret: {}
maxRunners: ${MAX_RUNNERS}
minRunners: 0
controllerServiceAccount:
  name: ${CONTROLLER_SA_NAME}
  namespace: arc-systems
template:
  spec:
    serviceAccountName: arc-runner-sa
    imagePullSecrets:
      - name: quay-pull
    volumes:
      - name: work
        emptyDir: {}
      - name: npm-cache
        emptyDir: {}
      - name: npm-tmp
        emptyDir: {}
    containers:
      - name: runner
        image: ${RUNNER_IMAGE}
        command: ['/home/runner/run.sh']
        env:
          - name: OPENSSL_FORCE_FIPS_MODE
            value: '0'
          - name: GOLANG_FIPS
            value: '0'
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop: ['ALL']
          runAsNonRoot: true
          runAsUser: 1001
          runAsGroup: 123
        volumeMounts:
          - name: work
            mountPath: '/home/runner/_work'
          - name: npm-cache
            mountPath: '/home/runner/.npm'
          - name: npm-tmp
            mountPath: '/home/runner/.tmp'
EOF
helm upgrade "${SCALE_SET_NAME}" "${ARC_HELM_REPO}/gha-runner-scale-set" \
  --install --namespace arc-runners \
  -f "${WORK}/runner-values.yaml" \
  --set "githubConfigSecret.github_token=${GITHUB_TOKEN}" \
  --version "${ARC_VERSION}" --wait --timeout 5m \
  --disable-openapi-validation >/dev/null

# --------------------------------------------------------------- 4. SCC + RBAC
echo "--- [4/6] SCC bind + runner RBAC"
oc adm policy add-scc-to-user github-arc -z arc-runner-sa -n arc-runners >/dev/null

oc apply -f "${REPO_ROOT}/ci-scripts/arc-runner-networking-rbac.yaml" >/dev/null
# manifest subject uses the chart-default SA name; patch to our SA
oc patch clusterrolebinding arc-runner-networking \
  --type='json' \
  -p='[{"op":"replace","path":"/subjects/0/name","value":"arc-runner-sa"}]' \
  2>/dev/null || \
oc patch clusterrolebinding arc-runner-networking \
  --type='json' \
  -p='[{"op":"add","path":"/subjects/0","value":{"kind":"ServiceAccount","name":"arc-runner-sa","namespace":"arc-runners"}}]'

oc apply -f - >/dev/null <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: arc-runner-ns-admin
  labels:
    app.kubernetes.io/component: arc-runner-rbac
rules:
  - apiGroups: [""]
    resources: ["namespaces", "configmaps", "secrets", "serviceaccounts", "pods", "pods/log", "services"]
    verbs: ["get", "list", "create", "delete", "patch", "update", "watch"]
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["roles", "rolebindings", "clusterrolebindings"]
    verbs: ["get", "list", "create", "delete", "patch", "update"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "create", "delete", "patch", "watch"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["ingresses"]
    verbs: ["get", "list", "create", "delete", "patch"]
  - apiGroups: ["route.openshift.io"]
    resources: ["routes"]
    verbs: ["get", "list", "create", "delete", "patch"]
  - apiGroups: ["k8s.cni.cncf.io"]
    resources: ["network-attachment-definitions"]
    verbs: ["get", "list", "create", "delete", "patch"]
  - apiGroups: ["k8s.ovn.org"]
    resources: ["userdefinednetworks", "clusteruserdefinednetworks"]
    verbs: ["get", "list", "create", "delete", "patch"]
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["get", "list", "create", "delete", "watch"]
EOF
oc create clusterrolebinding arc-runner-ns-admin \
  --clusterrole=arc-runner-ns-admin \
  --serviceaccount=arc-runners:arc-runner-sa \
  --dry-run=client -o yaml | oc apply -f - >/dev/null

# --------------------------------------------------------- 5. ci-env-controller
echo "--- [5/6] ci-env-controller (ci-env)"
oc create namespace ci-env --dry-run=client -o yaml | oc apply -f - >/dev/null

# quay-pull into ci-env (controller copies it into each test namespace)
if ! oc get secret quay-pull -n ci-env >/dev/null 2>&1; then
  oc create secret docker-registry quay-pull \
    --from-file=.dockerconfigjson="${WORK}/dockerconfig.json" \
    -n ci-env >/dev/null
fi

if [ "${SKIP_BUILD_CONTROLLER:-0}" != "1" ]; then
  # Build controller image in-cluster. The chart must be UNPACKED at
  # /charts/ci-test-stack (not .tgz) — the controller runs
  # `helm install /charts/ci-test-stack`.
  BUILD_DIR="${WORK}/ci-env-controller-build"
  mkdir -p "${BUILD_DIR}/charts"
  helm package "${REPO_ROOT}/ci-scripts/helm/ci-test-stack" -d "${BUILD_DIR}/charts/" >/dev/null
  cp "${REPO_ROOT}/ci-scripts/helm/ci-env-controller/scripts/ci-env-controller.sh" "${BUILD_DIR}/"
  cat > "${BUILD_DIR}/Dockerfile" <<'EOF'
FROM registry.access.redhat.com/ubi9/ubi-minimal:9.4
RUN microdnf install -y bash tar gzip && microdnf clean all
RUN curl -sL https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/stable/openshift-client-linux.tar.gz -o /tmp/oc.tar.gz \
  && tar -xzf /tmp/oc.tar.gz -C /usr/local/bin oc kubectl && chmod +x /usr/local/bin/oc /usr/local/bin/kubectl && rm /tmp/oc.tar.gz
RUN curl -sL https://get.helm.sh/helm-v3.14.4-linux-amd64.tar.gz -o /tmp/helm.tar.gz \
  && tar -xzf /tmp/helm.tar.gz -C /tmp && mv /tmp/linux-amd64/helm /usr/local/bin/helm && chmod +x /usr/local/bin/helm && rm -rf /tmp/helm*
COPY charts/ci-test-stack-*.tgz /tmp/chart.tgz
RUN mkdir -p /charts && tar -xzf /tmp/chart.tgz -C /charts && rm /tmp/chart.tgz \
  && test -f /charts/ci-test-stack/Chart.yaml
COPY ci-env-controller.sh /ci-env-controller.sh
RUN chmod +x /ci-env-controller.sh
CMD ["/bin/bash", "/ci-env-controller.sh"]
EOF
  oc get buildconfig ci-env-controller -n ci-env >/dev/null 2>&1 || \
    oc new-build --name ci-env-controller --binary --strategy docker -n ci-env >/dev/null
  # --from-dir auto-tars the context (binary archive upload has been flaky)
  oc start-build ci-env-controller --from-dir="${BUILD_DIR}" --follow -n ci-env >/dev/null
fi

helm upgrade ci-env-controller "${REPO_ROOT}/ci-scripts/helm/ci-env-controller" \
  --install --namespace ci-env \
  --set runnerServiceAccount=arc-runner-sa \
  --set runnerServiceAccountNamespace=arc-runners \
  --set pluginPullSecret=quay-pull \
  --wait --disable-openapi-validation >/dev/null
oc rollout status deployment/ci-env-controller-controller -n ci-env --timeout=120s >/dev/null

# ------------------------------------------------------------------ 6. verify
echo "--- [6/6] verification"
ARC_RUNNERS_NS=arc-runners bash "${REPO_ROOT}/ci-scripts/check-cluster-health.sh"

LISTENER_PODS=$(oc get pods -n arc-systems -l "app.kubernetes.io/name=gha-runner-scale-set-listener" --no-headers 2>/dev/null | grep -c Running || true)
[ "${LISTENER_PODS}" -ge 1 ] || LISTENER_PODS=$(oc get pods -n arc-systems --no-headers 2>/dev/null | grep -ci listener || true)
if [ "${LISTENER_PODS}" -lt 1 ]; then
  echo "WARN: no ARC listener pod Running in arc-systems — runner registration will not happen"
else
  echo "Listener pod Running (${LISTENER_PODS})"
fi

echo ""
echo "=== Hot cluster prepared ==="
echo "Runner scale set: ${SCALE_SET_NAME} (label '${SCALE_SET_NAME}' == runs-on in workflows)"
echo "Verify on GitHub: gh api ${GITHUB_CONFIG_URL#https://github.com/}/actions/runners"
echo "Smoke test:       gh workflow run hot-cluster-e2e.yml --ref main -f test_spec=tests/all.cy.ts"
