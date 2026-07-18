#!/bin/bash
#
# Clean up test resources created during E2E runs.
# Uses TEST_NS and UDN_NS from the environment.
#
set -x +e

TEST_NS="${TEST_NS:-cy-test-ns}"
UDN_NS="${UDN_NS:-udn-test-ns}"

echo "Cleaning up test resources in ${TEST_NS}..."
oc delete --ignore-not-found=true -n "${TEST_NS}" net-attach-def network-bridge network-ovn network-localnet --wait=false
oc delete --ignore-not-found=true -n "${TEST_NS}" service example --wait=false
oc delete --ignore-not-found=true -n "${TEST_NS}" route auto-test-route --wait=false
oc delete --ignore-not-found=true -n "${TEST_NS}" ingress example --wait=false
oc delete --ignore-not-found=true -n "${TEST_NS}" networkpolicy auto-test-net-policy --wait=true --timeout=60s
oc delete --ignore-not-found=true -n "${TEST_NS}" multi-networkpolicy auto-test-multi-policy --wait=false

echo "Cleaning up UDN resources..."
oc delete --ignore-not-found=true ClusterUserDefinedNetwork cluster-udn --wait=false
oc delete --ignore-not-found=true -n "${UDN_NS}" UserDefinedNetwork primary-udn --wait=false
oc delete nncp --all --ignore-not-found --wait=false

echo "Deleting test namespaces..."
oc delete namespace "${TEST_NS}" --ignore-not-found --wait=false
oc delete namespace "${UDN_NS}" --ignore-not-found --wait=false

echo "Cleanup done."
