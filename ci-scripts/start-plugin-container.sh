#!/bin/bash
set -euox pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -n "${DOCKER_HOST:-}" ]] && command -v docker &>/dev/null; then
  RUNTIME=$(command -v docker)
elif command -v podman &>/dev/null; then
  RUNTIME=$(command -v podman)
else
  RUNTIME=$(command -v docker)
fi

VOL_SUFFIX=":ro"
[[ "${RUNTIME}" == *podman ]] && VOL_SUFFIX=":ro,z"

if [[ -z "${PLUGIN_IMAGE:-}" ]]; then
  PLUGIN_IMAGE="localhost/networking-console-plugin:local"
  $RUNTIME build -t "${PLUGIN_IMAGE}" -f Dockerfile "${REPO_ROOT}"
fi

PLUGIN_NAME=${PLUGIN_NAME:-networking-console-plugin-ci}
PLUGIN_PORT=${PLUGIN_PORT:-9001}
PLUGIN_TRANSPORT=${PLUGIN_TRANSPORT:-http}

echo "Using PLUGIN_IMAGE: ${PLUGIN_IMAGE}"
echo "Using PLUGIN_NAME: ${PLUGIN_NAME}"
echo "Using PLUGIN_PORT: ${PLUGIN_PORT}"
echo "Using PLUGIN_TRANSPORT: ${PLUGIN_TRANSPORT}"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    echo "<details><summary>Networking Plugin Container</summary>"
    echo ""
    echo "| Item | Value |"
    echo "|------|-------|"
    echo "| Plugin image | \`${PLUGIN_IMAGE}\` |"
    echo "| Plugin port | \`${PLUGIN_PORT}\` |"
    echo "| Plugin transport | \`${PLUGIN_TRANSPORT}\` |"
    echo "| Container name | \`${PLUGIN_NAME}\` |"
    echo "| Container runtime | \`${RUNTIME}\` |"
    echo ""
    echo "</details>"
  } >> "${GITHUB_STEP_SUMMARY}"
fi

CERT_CONFIG=""
if [[ "${PLUGIN_TRANSPORT}" == "https" ]]; then
  CERT_PARENT="${REPO_ROOT}/ci-scripts/generated"
  mkdir -p "${CERT_PARENT}" || true
  PLUGIN_CERT_DIR=$(mktemp -d "${CERT_PARENT}/.tmp-plugin-cert.XXXXXX")
  openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
    -keyout "${PLUGIN_CERT_DIR}/tls.key" \
    -out "${PLUGIN_CERT_DIR}/tls.crt" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:host.docker.internal"
  chmod a+rx "${PLUGIN_CERT_DIR}"
  chmod a+r "${PLUGIN_CERT_DIR}/tls.crt" "${PLUGIN_CERT_DIR}/tls.key"

  CERT_CONFIG="-v ${PLUGIN_CERT_DIR}:/var/serving-cert${VOL_SUFFIX}"
fi

CONTAINER_CONFIG=${SCRIPT_DIR}/nginx-9080.conf
CONTAINER_PORT=9080
if [[ "${PLUGIN_TRANSPORT}" == "https" ]]; then
  CONTAINER_CONFIG=${SCRIPT_DIR}/nginx-9443.conf
  CONTAINER_PORT=9443
fi

$RUNTIME rm -f "${PLUGIN_NAME}" 2>/dev/null || true
$RUNTIME run -d \
  --name "${PLUGIN_NAME}" \
  -p "${PLUGIN_PORT}:${CONTAINER_PORT}" \
  -v "${CONTAINER_CONFIG}:/etc/nginx/nginx.conf${VOL_SUFFIX}" \
  ${CERT_CONFIG} \
  "${PLUGIN_IMAGE}"
