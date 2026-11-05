#!/usr/bin/env bash

# Setup test namespaces (create if they don't exist)
# Sources .env for namespace names

source .env 2>/dev/null || true
TEST_NS="${TEST_NS:-cy-test-ns}"
NAD_NS="${NAD_NS:-nad-test-ns}"
UDN_NS="${UDN_NS:-udn-test-ns}"
EMPTY_NS="${EMPTY_NS:-empty-test-ns}"
CUDN_NS="${CUDN_NS:-cudn-test-ns}"
TOPO_NS="${TOPO_NS:-topo-test-ns}"
LOCALNET_NS="${LOCALNET_NS:-localnet-test-ns}"
UDN_LABEL="k8s.ovn.org/primary-user-defined-network"
CUDN_LABEL="e2e.networking-console-plugin/cudn"
CUDN_31_LABEL="e2e.networking-console-plugin/cudn-31"
LOCALNET_LABEL="e2e.networking-console-plugin/localnet"

ensure_ns() {
  local name="$1"
  shift
  if oc get namespace "${name}" &>/dev/null; then
    echo "Namespace ${name} already exists."
    return 0
  fi
  if [ "$#" -eq 0 ]; then
    oc create namespace "${name}"
    return 0
  fi
  {
    echo "apiVersion: v1"
    echo "kind: Namespace"
    echo "metadata:"
    echo "  name: ${name}"
    echo "  labels:"
    for pair in "$@"; do
      echo "    ${pair}"
    done
  } | oc create -f -
}

setup () {
  echo "Setting up test namespaces..."
  ensure_ns "${TEST_NS}"
  ensure_ns "${NAD_NS}"
  ensure_ns "${EMPTY_NS}"

  # UDN / CUDN member namespaces must have labels at creation time
  # (admission policy prevents adding the primary UDN label later).
  if oc get namespace "${UDN_NS}" &>/dev/null; then
    if ! oc get namespace "${UDN_NS}" -o jsonpath='{.metadata.labels}' | grep -q "${UDN_LABEL}"; then
      echo "UDN namespace exists but missing label, recreating..."
      oc delete namespace "${UDN_NS}" --wait=true --timeout=120s
      oc wait --for=delete "namespace/${UDN_NS}" --timeout=120s 2>/dev/null || true
      ensure_ns "${UDN_NS}" "${UDN_LABEL}: \"\""
    else
      echo "UDN namespace exists with proper label."
    fi
  else
    ensure_ns "${UDN_NS}" "${UDN_LABEL}: \"\""
  fi

  ensure_ns "${CUDN_NS}" \
    "${UDN_LABEL}: \"\"" \
    "${CUDN_LABEL}: member" \
    "${CUDN_31_LABEL}: member"
  ensure_ns "${TOPO_NS}" \
    "${UDN_LABEL}: \"\"" \
    "${CUDN_LABEL}: member"
  ensure_ns "${LOCALNET_NS}" "${LOCALNET_LABEL}: member"
  echo "Setup done."
}
