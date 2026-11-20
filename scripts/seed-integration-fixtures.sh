#!/usr/bin/env bash
# Creates the objects the integration fixtures are recorded from, then (with
# --cleanup) removes them again. Everything lives in the namespace the recorder
# is allowed to capture, so no real project data can end up in a fixture.
#
# Usage:
#   ./scripts/seed-integration-fixtures.sh            # create and wait
#   ./scripts/seed-integration-fixtures.sh --cleanup  # remove
set -euo pipefail

cd "$(dirname "$0")/.."

NS="${NS:-cy-test-ns}"

# The sanitizer only accepts these two namespaces, so a mistyped NS has to stop
# here: seeding applies a deny-all NetworkPolicy in it and --cleanup deletes by
# name, which would hit unrelated workloads in any other namespace.
case "$NS" in
  cy-test-ns | udn-test-ns) ;;
  *)
    echo "refusing to seed: NS must be cy-test-ns or udn-test-ns" >&2
    exit 1
    ;;
esac

NAD="network-attachment-definitions.k8s.cni.cncf.io"
UDN="userdefinednetworks.k8s.ovn.org"

# The CUDN below is cluster-scoped, so it carries the label the suite's e2e seeds
# already use (ui-tests-cy/views/physical-networks.ts) and ci-scripts/test-cleanup.sh
# sweeps. Ownership is checked before it is created or deleted: a shared cluster may
# already hold an object of the same name that this suite must not touch.
MANAGED_BY_LABEL="app.kubernetes.io/managed-by"
MANAGED_BY_VALUE="networking-console-plugin-test"
CUDN="clusteruserdefinednetwork/test-cudn-team"

cudn_owner() {
  oc get "$CUDN" -o jsonpath='{.metadata.labels.app\.kubernetes\.io/managed-by}' 2>/dev/null ||
    true
}

cleanup() {
  oc delete -n "$NS" --ignore-not-found \
    pod/web-1 pod/web-2 pod/other-1 \
    service/web service/cluster-ip service/headless service/node-port \
    service/load-balancer service/external-name service/healthy service/degraded service/down \
    "${NAD}/network-bridge" "${NAD}/other-nad" \
    "${UDN}/udn-layer2" "${UDN}/udn-layer3" \
    ingress/shop ingress/no-rules \
    route/shop route/draft \
    networkpolicy/deny-all networkpolicy/allow-web \
    endpointslice/healthy-1 endpointslice/degraded-1 endpointslice/down-1 \
    virtualmachine/vm-plain virtualmachine/vm-qualified virtualmachine/vm-other \
    virtualmachine/vm-detached
  if oc get "$CUDN" >/dev/null 2>&1; then
    if [ "$(cudn_owner)" = "$MANAGED_BY_VALUE" ]; then
      oc delete "$CUDN" --ignore-not-found
    else
      echo "leaving $CUDN: it is not labelled $MANAGED_BY_VALUE" >&2
    fi
  fi
}

if [ "${1-}" = "--cleanup" ]; then
  cleanup
  exit 0
fi

oc get namespace "$NS" >/dev/null

if oc get "$CUDN" >/dev/null 2>&1 && [ "$(cudn_owner)" != "$MANAGED_BY_VALUE" ]; then
  echo "refusing to seed: $CUDN exists and is not labelled $MANAGED_BY_VALUE" >&2
  exit 1
fi

# The namespace carries audit/warn PodSecurity labels only, so the pause pods
# below are admitted. Health states use manually managed EndpointSlices on
# selector-less Services, which keeps the fixture deterministic.
oc apply -f - <<YAML
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: ${NS}
spec:
  selector:
    app: web
  ports:
    - name: http
      port: 80
      protocol: TCP
      targetPort: 8080
---
apiVersion: v1
kind: Pod
metadata:
  name: web-1
  namespace: ${NS}
  labels:
    app: web
spec:
  containers:
    - name: web
      image: registry.k8s.io/pause:3.9
      ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Pod
metadata:
  name: web-2
  namespace: ${NS}
  labels:
    app: web
spec:
  containers:
    - name: web
      image: registry.k8s.io/pause:3.9
      ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Pod
metadata:
  name: other-1
  namespace: ${NS}
  labels:
    app: other
spec:
  containers:
    - name: other
      image: registry.k8s.io/pause:3.9
---
apiVersion: k8s.cni.cncf.io/v1
kind: NetworkAttachmentDefinition
metadata:
  name: network-bridge
  namespace: ${NS}
  annotations:
    description: Recorded bridge network
spec:
  config: '{"cniVersion":"0.3.1","name":"network-bridge","type":"bridge","bridge":"br0","vlan":300}'
---
apiVersion: k8s.cni.cncf.io/v1
kind: NetworkAttachmentDefinition
metadata:
  name: other-nad
  namespace: ${NS}
spec:
  config: '{"cniVersion":"0.3.1","name":"other-nad","type":"bridge","bridge":"br1","vlan":301}'
---
apiVersion: k8s.ovn.org/v1
kind: UserDefinedNetwork
metadata:
  name: udn-layer2
  namespace: ${NS}
spec:
  topology: Layer2
  layer2:
    role: Secondary
    subnets:
      - 10.100.0.0/24
---
apiVersion: k8s.ovn.org/v1
kind: UserDefinedNetwork
metadata:
  name: udn-layer3
  namespace: ${NS}
spec:
  topology: Layer3
  layer3:
    role: Secondary
    subnets:
      - cidr: 10.101.0.0/16
---
apiVersion: k8s.ovn.org/v1
kind: ClusterUserDefinedNetwork
metadata:
  labels:
    ${MANAGED_BY_LABEL}: ${MANAGED_BY_VALUE}
  name: test-cudn-team
spec:
  # Kubernetes adds this label to every Namespace. Pin the CUDN to the suite's
  # own namespace so a shared cluster with a same-labelled project is untouched.
  namespaceSelector:
    matchLabels:
      kubernetes.io/metadata.name: ${NS}
  network:
    topology: Layer2
    layer2:
      role: Secondary
      subnets:
        - 10.102.0.0/24
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
  namespace: ${NS}
spec:
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: no-rules
  namespace: ${NS}
spec:
  defaultBackend:
    service:
      name: web
      port:
        number: 80
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: shop
  namespace: ${NS}
spec:
  host: shop.example.com
  to:
    kind: Service
    name: web
    weight: 100
  port:
    targetPort: http
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: draft
  namespace: ${NS}
spec:
  to:
    kind: Service
    name: missing
    weight: 100
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: ${NS}
spec:
  podSelector: {}
  policyTypes:
    - Ingress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web
  namespace: ${NS}
spec:
  podSelector:
    matchLabels:
      app: web
  ingress:
    - {}
  egress:
    - {}
  policyTypes:
    - Ingress
    - Egress
---
apiVersion: v1
kind: Service
metadata:
  name: cluster-ip
  namespace: ${NS}
spec:
  selector:
    app: cluster-ip
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: headless
  namespace: ${NS}
spec:
  clusterIP: None
  selector:
    app: headless
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: node-port
  namespace: ${NS}
spec:
  type: NodePort
  selector:
    app: node-port
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080
---
apiVersion: v1
kind: Service
metadata:
  name: load-balancer
  namespace: ${NS}
spec:
  type: LoadBalancer
  selector:
    app: load-balancer
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: external-name
  namespace: ${NS}
spec:
  type: ExternalName
  externalName: example.com
  ports:
    - port: 80
---
apiVersion: v1
kind: Service
metadata:
  name: healthy
  namespace: ${NS}
spec:
  ports:
    - port: 80
---
apiVersion: v1
kind: Service
metadata:
  name: degraded
  namespace: ${NS}
spec:
  ports:
    - port: 80
---
apiVersion: v1
kind: Service
metadata:
  name: down
  namespace: ${NS}
spec:
  ports:
    - port: 80
---
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: healthy-1
  namespace: ${NS}
  labels:
    kubernetes.io/service-name: healthy
addressType: IPv4
endpoints:
  - addresses:
      - 192.0.2.10
    conditions:
      ready: true
  - addresses:
      - 192.0.2.11
    conditions:
      ready: true
ports:
  - name: http
    port: 80
    protocol: TCP
---
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: degraded-1
  namespace: ${NS}
  labels:
    kubernetes.io/service-name: degraded
addressType: IPv4
endpoints:
  - addresses:
      - 192.0.2.12
    conditions:
      ready: true
  - addresses:
      - 192.0.2.13
    conditions:
      ready: false
ports:
  - name: http
    port: 80
    protocol: TCP
---
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: down-1
  namespace: ${NS}
  labels:
    kubernetes.io/service-name: down
addressType: IPv4
endpoints:
  - addresses:
      - 192.0.2.14
    conditions:
      ready: false
  - addresses:
      - 192.0.2.15
    conditions:
      ready: false
ports:
  - name: http
    port: 80
    protocol: TCP
---
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: vm-plain
  namespace: ${NS}
spec:
  running: false
  template:
    metadata:
      labels:
        kubevirt.io/domain: vm-plain
    spec:
      domain:
        resources:
          requests:
            memory: 64Mi
        devices:
          interfaces:
            - name: nad-net
              bridge: {}
      networks:
        - name: nad-net
          multus:
            networkName: udn-layer2
---
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: vm-qualified
  namespace: ${NS}
spec:
  running: false
  template:
    metadata:
      labels:
        kubevirt.io/domain: vm-qualified
    spec:
      domain:
        resources:
          requests:
            memory: 64Mi
        devices:
          interfaces:
            - name: nad-net
              bridge: {}
      networks:
        - name: nad-net
          multus:
            networkName: ${NS}/udn-layer2
---
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: vm-other
  namespace: ${NS}
spec:
  running: false
  template:
    metadata:
      labels:
        kubevirt.io/domain: vm-other
    spec:
      domain:
        resources:
          requests:
            memory: 64Mi
        devices:
          interfaces:
            - name: nad-net
              bridge: {}
      networks:
        - name: nad-net
          multus:
            networkName: other-nad
---
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: vm-detached
  namespace: ${NS}
spec:
  running: false
  template:
    metadata:
      labels:
        kubevirt.io/domain: vm-detached
    spec:
      domain:
        resources:
          requests:
            memory: 64Mi
        devices:
          interfaces:
            - name: nad-net
              bridge: {}
              state: absent
      networks:
        - name: nad-net
          multus:
            networkName: udn-layer2
YAML

# The controller publishes an EndpointSlice as soon as the Service has a
# selector, but its endpoints are not ready until both pause pods run. The list
# suites assert 2/2, so wait for two ready endpoints rather than any slice.
ready=0
for _ in $(seq 1 30); do
  ready=$(
    oc get endpointslices -n "$NS" -l kubernetes.io/service-name=web \
      -o jsonpath='{range .items[*].endpoints[*]}{.conditions.ready}{"\n"}{end}' 2>/dev/null |
      grep -c '^true$' || true
  )
  [ "$ready" -ge 2 ] && break
  sleep 4
done
if [ "$ready" -lt 2 ]; then
  echo "refusing to seed: service/web has fewer than 2 ready endpoints after 2 minutes" >&2
  exit 1
fi

# Route and Ingress status is populated asynchronously. The Ingress controller
# also creates one Route per host; wait for both derived Routes so the recorded
# list has the shape the console sees.
route_status=""
derived=0
for _ in $(seq 1 15); do
  route_status=$(oc get route shop -n "$NS" -o jsonpath='{.status.ingress}' 2>/dev/null || true)
  derived=$(oc get routes -n "$NS" -o name 2>/dev/null | grep -c 'route.route.openshift.io/shop-' || true)
  [ -n "$route_status" ] && [ "$derived" -ge 2 ] && break
  sleep 2
done
# Falling through here would record a Route list with no admitted route, which the
# fixtures would then carry as if it were the console's real view.
if [ -z "$route_status" ] || [ "$derived" -lt 2 ]; then
  echo "refusing to seed: route/shop status or its derived routes did not appear" >&2
  exit 1
fi

echo "seeded:"
# Names only: a table row for a Route carries its cluster-generated hostname,
# which embeds the cluster's apps domain. The recorder is what needs the data;
# the shell output goes to terminals and CI logs.
oc get -n "$NS" pods,services,endpointslices,ingresses,routes,networkpolicies,"$NAD","$UDN",virtualmachines -o name 2>/dev/null || true
echo "run ./scripts/record-integration-fixtures.sh, then --cleanup"
