#!/usr/bin/env bash

# Cleanup test resources from previous runs
# Sources .env for namespace names

source .env 2>/dev/null || true
TEST_NS="${TEST_NS:-cy-test-ns}"
NAD_NS="${NAD_NS:-nad-test-ns}"
UDN_NS="${UDN_NS:-udn-test-ns}"

cleanup () {
  echo "Cleaning up test resources..."
  oc delete --ignore-not-found=true -n "${TEST_NS}" net-attach-def network-bridge network-ovn network-localnet --wait=false
  oc delete --ignore-not-found=true -n "${TEST_NS}" service example --wait=false
  oc delete --ignore-not-found=true -n "${TEST_NS}" route auto-test-route --wait=false
  oc delete --ignore-not-found=true -n "${TEST_NS}" ingress example --wait=false
  oc delete --ignore-not-found=true -n "${TEST_NS}" networkpolicy auto-test-net-policy --wait=true --timeout=60s
  oc delete --ignore-not-found=true -n "${TEST_NS}" multi-networkpolicy auto-test-multi-policy --wait=false
  oc delete --ignore-not-found=true -n "${NAD_NS}" net-attach-def --all --wait=false
  oc delete --ignore-not-found=true ClusterUserDefinedNetwork test-cudn-nad test-cudn-topo test-cudn-localnet cluster-udn --wait=false
  oc delete --ignore-not-found=true -n "${UDN_NS}" UserDefinedNetwork --all --wait=false
  oc delete --ignore-not-found=true nncp -l app.kubernetes.io/managed-by=networking-console-plugin-test --wait=false
  echo "Cleanup done."
}
