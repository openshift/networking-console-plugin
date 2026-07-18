#!/usr/bin/env bash

# Setup test namespaces (create if they don't exist)
# Sources .env for namespace names

source .env 2>/dev/null || true
TEST_NS="${TEST_NS:-cy-test-ns}"
UDN_NS="${UDN_NS:-udn-test-ns}"
UDN_LABEL="k8s.ovn.org/primary-user-defined-network"

setup () {
  echo "Setting up test namespaces..."
  oc get namespace ${TEST_NS} 2>/dev/null || oc create namespace ${TEST_NS}

  # UDN namespace must have the label at creation time (admission policy prevents adding later)
  if oc get namespace ${UDN_NS} 2>/dev/null; then
    if ! oc get namespace ${UDN_NS} -o jsonpath='{.metadata.labels}' | grep -q "${UDN_LABEL}"; then
      echo "UDN namespace exists but missing label, recreating..."
      oc delete namespace ${UDN_NS} --wait=true --timeout=120s
      oc wait --for=delete namespace/${UDN_NS} --timeout=120s 2>/dev/null || true
      oc create -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ${UDN_NS}
  labels:
    ${UDN_LABEL}: ""
EOF
    else
      echo "UDN namespace exists with proper label."
    fi
  else
    oc create -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ${UDN_NS}
  labels:
    ${UDN_LABEL}: ""
EOF
  fi
  echo "Setup done."
}
