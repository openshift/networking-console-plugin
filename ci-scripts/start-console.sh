#!/bin/bash
#
# Start the "off cluster" console for CI testing.
# Networking-console-plugin does not need the kubevirt API proxy route,
# so this is simpler than the kubevirt-plugin equivalent.
#
set -euox pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# BRIDGE_* — off-cluster console
BRIDGE_USER_AUTH="disabled"
BRIDGE_K8S_MODE="off-cluster"
BRIDGE_K8S_AUTH="bearer-token"
BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS="true"
BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT="$(oc whoami --show-server)"
BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS="$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}' 2>/dev/null || true)"
BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER="$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}' 2>/dev/null || true)"
BRIDGE_USER_SETTINGS_LOCATION="localstorage"
BRIDGE_I18N_NAMESPACES="plugin__networking-console-plugin"

BRIDGE_K8S_AUTH_BEARER_TOKEN="$(oc whoami --show-token 2>/dev/null || true)"
if [[ -z "${BRIDGE_K8S_AUTH_BEARER_TOKEN}" ]]; then
  echo "::error::Could not read bearer token (oc whoami --show-token)."
  exit 1
fi
echo "::add-mask::${BRIDGE_K8S_AUTH_BEARER_TOKEN}"

BRIDGE_PLUGINS="networking-console-plugin=${PLUGIN_TRANSPORT}://host.docker.internal:${PLUGIN_PORT}"

eval "$(bash "${SCRIPT_DIR}/resolve-console-image.sh")" || true
CONSOLE_IMAGE="${CONSOLE_IMAGE:-quay.io/openshift/origin-console:latest}"
CONSOLE_PORT=${CONSOLE_PORT:-9000}

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    echo "<details><summary>Off-cluster console (CI)</summary>"
    echo ""
    echo "| Item | Value |"
    echo "|------|-------|"
    echo "| Console image | \`${CONSOLE_IMAGE}\` |"
    echo "| Console URL | \`http://localhost:${CONSOLE_PORT}\` |"
    echo "| API server | \`${BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT}\` |"
    echo "| BRIDGE_PLUGINS | \`${BRIDGE_PLUGINS}\` |"
    echo ""
    echo "</details>"
  } >> "${GITHUB_STEP_SUMMARY}"
fi

echo "Starting console container..."
echo "  API server: ${BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT}"
echo "  Console image: ${CONSOLE_IMAGE}"

DOCKER_RUN_EXTRA=()
if [[ "$(uname -s)" == "Linux" ]]; then
  DOCKER_RUN_EXTRA+=(--add-host=host.docker.internal:host-gateway)
fi

docker run -d --pull=always --rm "${DOCKER_RUN_EXTRA[@]}" \
  -p "${CONSOLE_PORT}:9000" \
  --name console \
  -e BRIDGE_USER_AUTH="${BRIDGE_USER_AUTH}" \
  -e BRIDGE_K8S_MODE="${BRIDGE_K8S_MODE}" \
  -e BRIDGE_K8S_AUTH="${BRIDGE_K8S_AUTH}" \
  -e BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS="${BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS}" \
  -e BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT="${BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT}" \
  -e BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS="${BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS}" \
  -e BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER="${BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER}" \
  -e BRIDGE_K8S_AUTH_BEARER_TOKEN="${BRIDGE_K8S_AUTH_BEARER_TOKEN}" \
  -e BRIDGE_USER_SETTINGS_LOCATION="${BRIDGE_USER_SETTINGS_LOCATION}" \
  -e BRIDGE_I18N_NAMESPACES="${BRIDGE_I18N_NAMESPACES}" \
  -e BRIDGE_PLUGINS="${BRIDGE_PLUGINS}" \
  "${CONSOLE_IMAGE}"
