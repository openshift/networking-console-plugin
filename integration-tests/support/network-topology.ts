import { MINUTE } from './commands';

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

const allNamespacesTopologyPath = '/k8s/all-namespaces/networking-topology';
const namespacedTopologyPath = (namespace: string): string =>
  `/k8s/ns/${namespace}/networking-topology`;

const topologySearch = () =>
  cy.get('[data-test-id="topology-search"] input', { timeout: 2 * MINUTE });

const topologyResourceFilter = () =>
  cy.get('[data-test-id="topology-resource-filter"]', { timeout: 2 * MINUTE });

export const visitAllNamespacesTopology = (query = ''): void => {
  cy.visit(`${allNamespacesTopologyPath}${query}`, {
    failOnStatusCode: false,
    timeout: 2 * MINUTE,
  });
  cy.dismissWelcomeTourIfPresent();
  waitForTopologyPageReady();
};

export const visitNamespacedTopology = (namespace: string, query = ''): void => {
  cy.visit(`${namespacedTopologyPath(namespace)}${query}`, {
    failOnStatusCode: false,
    timeout: 2 * MINUTE,
  });
  cy.dismissWelcomeTourIfPresent();
  waitForTopologyPageReady();
};

export const waitForTopologyPageReady = (): void => {
  cy.contains('h1', 'Topology', { timeout: 2 * MINUTE }).should('be.visible');
  topologySearch().should('be.visible');
  cy.get('#topology-display-graph', { timeout: 2 * MINUTE }).should('be.visible');
  cy.get('.pf-topology-container', { timeout: 2 * MINUTE }).should('exist');
};

export const searchTopology = (query: string): void => {
  topologySearch().as('topologySearch');
  cy.get('@topologySearch').clear();
  cy.get('@topologySearch').type(query);
};

export const clearTopologySearch = (): void => {
  topologySearch().clear();
};

export const assertTopologyNodeById = (nodeId: string): void => {
  cy.get(`[data-id="${nodeId}"]`, { timeout: 2 * MINUTE }).should('exist');
};

export const assertTopologyNodeHiddenById = (nodeId: string): void => {
  cy.get(`[data-id="${nodeId}"]`).should('not.exist');
};

export const clickTopologyNodeById = (nodeId: string): void => {
  cy.get(`[data-id="${nodeId}"]`, { timeout: MINUTE }).as('topologyNode');
  cy.get('@topologyNode').click({ force: true });
};

export const assertTopologyNodeSelectedById = (nodeId: string): void => {
  cy.get(`[data-id="${nodeId}"]`, { timeout: MINUTE }).should('have.class', 'pf-m-selected');
};

export const assertTopologyEdgeBetween = (sourceId: string, targetId: string): void => {
  const edgeId = `${sourceId}-to-${targetId}`;
  cy.get(`[data-id="${edgeId}"]`, { timeout: 2 * MINUTE }).should('exist');
};

export const filterTopologyByResourceType = (resourceTypeLabel: string): void => {
  topologyResourceFilter().click();
  cy.contains('[role="option"]', resourceTypeLabel, { matchCase: false, timeout: MINUTE }).click();
  // Close the select by clicking the toggle again.
  topologyResourceFilter().click();
};

export const waitForTopologyNodeById = (nodeId: string): void => {
  cy.get(`[data-id="${nodeId}"]`, { timeout: 5 * MINUTE }).should('exist');
};

export const waitForManagedNad = (name: string, namespace: string): void => {
  cy.exec(
    `bash -c 'for i in $(seq 1 24); do oc get network-attachment-definitions.k8s.cni.cncf.io ${name} -n ${namespace} && exit 0; sleep 5; done; echo "timed out waiting for managed NAD ${namespace}/${name}" >&2; exit 1'`,
    { failOnNonZeroExit: true, timeout: 3 * MINUTE },
  );
};
