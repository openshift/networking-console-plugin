export const ALL_NAMESPACES_TOPOLOGY_PATH = '/k8s/all-namespaces/networking-topology';

export const namespacedTopologyPath = (namespace: string): string =>
  `/k8s/ns/${namespace}/networking-topology`;

// OCPNETUI-31 fixtures
export const TOPOLOGY_EMPTY_NS = 'ocpnetui-31-empty';
export const NAD_NS = 'ocpnetui-31-nads';
export const UDN_NS = 'ocpnetui-31-udn';
export const CUDN_NS = 'ocpnetui-31-cudn';

export const NAD_CNV_BRIDGE = 'nad-cnv-bridge';
export const NAD_OVN = 'nad-ovn';
export const NAD_SRIOV = 'nad-sriov';
export const UDN_NAME = 'udn-with-nad';
export const CUDN_NAME = 'test-cudn-nad';
export const CUDN_NAD_NAME = 'cluster.udn.test-cudn-nad';

export const NAD_CNV_BRIDGE_NODE_ID = `NetworkAttachmentDefinition-${NAD_NS}-${NAD_CNV_BRIDGE}`;
export const NAD_OVN_NODE_ID = `NetworkAttachmentDefinition-${NAD_NS}-${NAD_OVN}`;
export const NAD_SRIOV_NODE_ID = `NetworkAttachmentDefinition-${NAD_NS}-${NAD_SRIOV}`;
export const UDN_NODE_ID = `UserDefinedNetwork-${UDN_NS}-${UDN_NAME}`;
export const UDN_NAD_NODE_ID = `NetworkAttachmentDefinition-${UDN_NS}-${UDN_NAME}`;
export const CUDN_NODE_ID = `ClusterUserDefinedNetwork-cluster-${CUDN_NAME}`;
export const CUDN_NAD_NODE_ID = `NetworkAttachmentDefinition-${CUDN_NS}-${CUDN_NAD_NAME}`;

// OCPNETUI-18 fixtures (distinct namespaces/names from OCPNETUI-31)
export const OCPNETUI18_EMPTY_NS = 'ocpnetui-18-empty';
export const UDN_LAYER2_NS = 'ocpnetui-18-udn-l2';
export const CUDN_LOCALNET_NS = 'ocpnetui-18-cudn-localnet';
export const CUDN_NS_A = 'ocpnetui-18-cudn-a';
export const CUDN_NS_B = 'ocpnetui-18-cudn-b';

export const UDN_LAYER2_NAME = 'udn-layer2';
export const CUDN_LOCALNET_NAME = 'test-cudn-localnet';
export const CUDN_LOCALNET_NAD_NAME = 'cluster.udn.test-cudn-localnet';
export const OCPNETUI18_CUDN_NAME = 'test-cudn-topo';
export const OCPNETUI18_CUDN_NAD_NAME = 'cluster.udn.test-cudn-topo';

export const UDN_LAYER2_NODE_ID = `UserDefinedNetwork-${UDN_LAYER2_NS}-${UDN_LAYER2_NAME}`;
export const UDN_LAYER2_NAD_NODE_ID = `NetworkAttachmentDefinition-${UDN_LAYER2_NS}-${UDN_LAYER2_NAME}`;
export const CUDN_LOCALNET_NODE_ID = `ClusterUserDefinedNetwork-cluster-${CUDN_LOCALNET_NAME}`;
export const CUDN_LOCALNET_NAD_NODE_ID = `NetworkAttachmentDefinition-${CUDN_LOCALNET_NS}-${CUDN_LOCALNET_NAD_NAME}`;
export const OCPNETUI18_CUDN_NODE_ID = `ClusterUserDefinedNetwork-cluster-${OCPNETUI18_CUDN_NAME}`;
export const OCPNETUI18_CUDN_NAD_NODE_ID_A = `NetworkAttachmentDefinition-${CUDN_NS_A}-${OCPNETUI18_CUDN_NAD_NAME}`;
export const OCPNETUI18_CUDN_NAD_NODE_ID_B = `NetworkAttachmentDefinition-${CUDN_NS_B}-${OCPNETUI18_CUDN_NAD_NAME}`;
