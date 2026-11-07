#!/usr/bin/env bash
# Records the real API payloads used by the integration tests and writes them,
# sanitized, under src/test/fixtures. Re-run whenever the cluster's networking
# state changes shape; the tests then replay the same JSON the console sees.
#
# All-or-nothing: payloads are written to a scratch directory and copied into
# place only after every recording succeeded, so a failed `oc` call cannot leave
# a truncated fixture behind.
#
# Usage: NS=cy-test-ns ./scripts/record-integration-fixtures.sh
set -euo pipefail

cd "$(dirname "$0")/.."

NS="${NS:-cy-test-ns}"
OUT="src/test/fixtures"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

# Identity tokens: node names and the API host/cluster label from the kubeconfig.
# Passed to the scrubber so they are replaced inside composite strings too.
server="$(oc config view --minify -o jsonpath='{.clusters[0].cluster.server}' 2>/dev/null || true)"
host="${server#*://}"
host="${host%%/*}"
host="${host%%:*}"
cluster="$(printf '%s' "$host" | cut -d. -f2)"
nodes="$(oc get nodenetworkstates -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | tr ' ' '\n' | paste -sd, -)"
export SANITIZE_NODE_TOKENS="$nodes"
export SANITIZE_CLUSTER_TOKENS="${host},${cluster}"

record() {
  local name="$1" path="$2"
  # NodeNetworkState is served as v1beta1; the rest use the version the plugin
  # models declare in src/utils/models/index.ts.
  oc get --raw "$path" | node scripts/sanitize-fixture.js > "$scratch/$name.json"
  printf '%-42s <- %s\n' "$name.json" "$path"
}

record services "/api/v1/namespaces/${NS}/services"
record endpointslices "/apis/discovery.k8s.io/v1/namespaces/${NS}/endpointslices"
record pods "/api/v1/namespaces/${NS}/pods"
record ingresses "/apis/networking.k8s.io/v1/namespaces/${NS}/ingresses"
record routes "/apis/route.openshift.io/v1/namespaces/${NS}/routes"
record networkpolicies "/apis/networking.k8s.io/v1/namespaces/${NS}/networkpolicies"
record multinetworkpolicies \
  "/apis/k8s.cni.cncf.io/v1beta1/namespaces/${NS}/multi-networkpolicies"
record networkattachmentdefinitions \
  "/apis/k8s.cni.cncf.io/v1/namespaces/${NS}/network-attachment-definitions"
record userdefinednetworks "/apis/k8s.ovn.org/v1/namespaces/${NS}/userdefinednetworks"
record clusteruserdefinednetworks "/apis/k8s.ovn.org/v1/clusteruserdefinednetworks"
record nodenetworkstates "/apis/nmstate.io/v1beta1/nodenetworkstates"
record nodenetworkconfigurationpolicies "/apis/nmstate.io/v1/nodenetworkconfigurationpolicies"
record nodenetworkconfigurationenactments \
  "/apis/nmstate.io/v1beta1/nodenetworkconfigurationenactments"
record networkconfig "/apis/operator.openshift.io/v1/networks/cluster"
record consolequickstarts "/apis/console.openshift.io/v1/consolequickstarts"
record nodes "/api/v1/nodes"
record virtualmachineclusterinstancetypes \
  "/apis/instancetype.kubevirt.io/v1beta1/virtualmachineclusterinstancetypes"
record virtualmachineinstancetypes \
  "/apis/instancetype.kubevirt.io/v1beta1/namespaces/${NS}/virtualmachineinstancetypes"
record virtualmachines \
  "/apis/kubevirt.io/v1/namespaces/${NS}/virtualmachines"
record virtualmachineinstances \
  "/apis/kubevirt.io/v1/namespaces/${NS}/virtualmachineinstances"

mkdir -p "$OUT"
cp "$scratch"/*.json "$OUT"/
npx prettier --write "$OUT"/*.json >/dev/null
echo "recorded $(ls -1 "$scratch" | wc -l) fixtures into $OUT"
