import { CUDN_NS, EMPTY_NS, LOCALNET_NS, NAD_NS, TOPO_NS, UDN_NS } from './base';

export const ALL_NAMESPACES_TOPOLOGY_PATH = '/k8s/all-namespaces/networking-topology';

export const namespacedTopologyPath = (namespace: string): string =>
  `/k8s/ns/${namespace}/networking-topology`;

export { CUDN_NS, EMPTY_NS, LOCALNET_NS, NAD_NS, TOPO_NS, UDN_NS };

// Shared empty-state namespace (provisioned by setup-test-namespaces / setup.sh)
export const TOPOLOGY_EMPTY_NS = EMPTY_NS;
export const OCPNETUI18_EMPTY_NS = EMPTY_NS;

// OCPNETUI-31 resource names
export const NAD_CNV_BRIDGE = 'nad-cnv-bridge';
export const NAD_OVN = 'nad-ovn';
export const NAD_SRIOV = 'nad-sriov';
export const UDN_NAME = 'udn-with-nad';
export const CUDN_NAME = 'test-cudn-nad';
// OVN-Kubernetes names a CUDN-managed NAD after the CUDN itself; older
// versions prefixed it with 'cluster.udn.'.
export const CUDN_NAD_NAME = 'test-cudn-nad';

export const NAD_CNV_BRIDGE_NODE_ID = `NetworkAttachmentDefinition-${NAD_NS}-${NAD_CNV_BRIDGE}`;
export const NAD_OVN_NODE_ID = `NetworkAttachmentDefinition-${NAD_NS}-${NAD_OVN}`;
export const NAD_SRIOV_NODE_ID = `NetworkAttachmentDefinition-${NAD_NS}-${NAD_SRIOV}`;
export const UDN_NODE_ID = `UserDefinedNetwork-${UDN_NS}-${UDN_NAME}`;
export const UDN_NAD_NODE_ID = `NetworkAttachmentDefinition-${UDN_NS}-${UDN_NAME}`;
export const CUDN_NODE_ID = `ClusterUserDefinedNetwork-cluster-${CUDN_NAME}`;
export const CUDN_NAD_NODE_ID = `NetworkAttachmentDefinition-${CUDN_NS}-${CUDN_NAD_NAME}`;

// OCPNETUI-18 resource names
export const UDN_LAYER2_NS = UDN_NS;
export const CUDN_LOCALNET_NS = LOCALNET_NS;

export const UDN_LAYER2_NAME = 'udn-layer2';
export const CUDN_LOCALNET_NAME = 'test-cudn-localnet';
export const CUDN_LOCALNET_NAD_NAME = 'test-cudn-localnet';
export const OCPNETUI18_CUDN_NAME = 'test-cudn-topo';
export const OCPNETUI18_CUDN_NAD_NAME = 'test-cudn-topo';

export const UDN_LAYER2_NODE_ID = `UserDefinedNetwork-${UDN_LAYER2_NS}-${UDN_LAYER2_NAME}`;
export const UDN_LAYER2_NAD_NODE_ID = `NetworkAttachmentDefinition-${UDN_LAYER2_NS}-${UDN_LAYER2_NAME}`;
export const CUDN_LOCALNET_NODE_ID = `ClusterUserDefinedNetwork-cluster-${CUDN_LOCALNET_NAME}`;
export const CUDN_LOCALNET_NAD_NODE_ID = `NetworkAttachmentDefinition-${CUDN_LOCALNET_NS}-${CUDN_LOCALNET_NAD_NAME}`;
export const OCPNETUI18_CUDN_NODE_ID = `ClusterUserDefinedNetwork-cluster-${OCPNETUI18_CUDN_NAME}`;
export const OCPNETUI18_CUDN_NAD_NODE_ID_A = `NetworkAttachmentDefinition-${CUDN_NS}-${OCPNETUI18_CUDN_NAD_NAME}`;
export const OCPNETUI18_CUDN_NAD_NODE_ID_B = `NetworkAttachmentDefinition-${TOPO_NS}-${OCPNETUI18_CUDN_NAD_NAME}`;
