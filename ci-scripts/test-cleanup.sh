#!/bin/bash
#
# Clean up test resources created during E2E runs.
# Uses shared test namespaces from the environment.
#
set -x +e

TEST_NS="${TEST_NS:-cy-test-ns}"
NAD_NS="${NAD_NS:-nad-test-ns}"
UDN_NS="${UDN_NS:-udn-test-ns}"
EMPTY_NS="${EMPTY_NS:-empty-test-ns}"
CUDN_NS="${CUDN_NS:-cudn-test-ns}"
TOPO_NS="${TOPO_NS:-topo-test-ns}"
LOCALNET_NS="${LOCALNET_NS:-localnet-test-ns}"

echo "Cleaning up test resources in ${TEST_NS}..."
oc delete --ignore-not-found=true -n "${TEST_NS}" net-attach-def network-bridge network-ovn network-localnet --wait=false
oc delete --ignore-not-found=true -n "${TEST_NS}" service example --wait=false
oc delete --ignore-not-found=true -n "${TEST_NS}" route auto-test-route --wait=false
oc delete --ignore-not-found=true -n "${TEST_NS}" ingress example --wait=false
oc delete --ignore-not-found=true -n "${TEST_NS}" networkpolicy auto-test-net-policy --wait=true --timeout=60s
oc delete --ignore-not-found=true -n "${TEST_NS}" multi-networkpolicy auto-test-multi-policy --wait=false

echo "Cleaning up NAD namespace resources in ${NAD_NS}..."
oc delete --ignore-not-found=true -n "${NAD_NS}" net-attach-def --all --wait=false

echo "Cleaning up UDN / CUDN resources..."
oc delete --ignore-not-found=true ClusterUserDefinedNetwork test-cudn-nad test-cudn-topo test-cudn-localnet cluster-udn --wait=false
oc delete --ignore-not-found=true -n "${UDN_NS}" UserDefinedNetwork --all --wait=false
oc delete --ignore-not-found=true nncp -l app.kubernetes.io/managed-by=networking-console-plugin-test --wait=false

echo "Deleting test namespaces..."
oc delete namespace "${TEST_NS}" "${NAD_NS}" "${UDN_NS}" "${EMPTY_NS}" "${CUDN_NS}" "${TOPO_NS}" "${LOCALNET_NS}" \
  --ignore-not-found --wait=false

echo "Cleanup done."
