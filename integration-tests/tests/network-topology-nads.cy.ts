import { checkErrors } from '../support';
import { MINUTE } from '../support/commands';
import {
  assertTopologyEdgeBetween,
  assertTopologyNodeById,
  assertTopologyNodeHiddenById,
  assertTopologyNodeSelectedById,
  clearTopologySearch,
  clickTopologyNodeById,
  CUDN_NAD_NAME,
  CUDN_NAD_NODE_ID,
  CUDN_NAME,
  CUDN_NODE_ID,
  CUDN_NS,
  filterTopologyByResourceType,
  NAD_CNV_BRIDGE,
  NAD_CNV_BRIDGE_NODE_ID,
  NAD_NS,
  NAD_OVN_NODE_ID,
  NAD_SRIOV_NODE_ID,
  searchTopology,
  TOPOLOGY_EMPTY_NS,
  UDN_NAD_NODE_ID,
  UDN_NAME,
  UDN_NODE_ID,
  UDN_NS,
  visitAllNamespacesTopology,
  visitNamespacedTopology,
  waitForManagedNad,
  waitForTopologyNodeById,
  waitForTopologyPageReady,
} from '../support/network-topology';

const FIXTURE = 'fixtures/network-topology-nads.yaml';
const TEST_NAMESPACES = [TOPOLOGY_EMPTY_NS, NAD_NS, UDN_NS, CUDN_NS];

describe('OCPNETUI-31: topology NAD nodes', { testIsolation: false }, () => {
  before(() => {
    cy.login();
    cy.applyFixtureFile(FIXTURE);
    waitForManagedNad(UDN_NAME, UDN_NS);
    waitForManagedNad(CUDN_NAD_NAME, CUDN_NS);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.exec(`oc delete clusteruserdefinednetwork ${CUDN_NAME} --ignore-not-found`, {
      failOnNonZeroExit: false,
      timeout: MINUTE,
    });
    cy.exec(
      `oc delete namespace ${TEST_NAMESPACES.join(' ')} --ignore-not-found --wait=false --request-timeout=30s`,
      { failOnNonZeroExit: false, timeout: MINUTE },
    );
    cy.logout();
  });

  it('loads topology normally when no NADs exist in the active namespace', () => {
    visitNamespacedTopology(TOPOLOGY_EMPTY_NS);
    waitForTopologyPageReady();
    assertTopologyNodeHiddenById(NAD_CNV_BRIDGE_NODE_ID);
    assertTopologyNodeHiddenById(NAD_OVN_NODE_ID);
    assertTopologyNodeHiddenById(NAD_SRIOV_NODE_ID);
  });

  it('shows NAD nodes for cnv-bridge, OVN-K, and SR-IOV types', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(NAD_CNV_BRIDGE_NODE_ID);
    assertTopologyNodeById(NAD_CNV_BRIDGE_NODE_ID);
    assertTopologyNodeById(NAD_OVN_NODE_ID);
    assertTopologyNodeById(NAD_SRIOV_NODE_ID);
  });

  it('filters the graph to NetworkAttachmentDefinition nodes', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(UDN_NODE_ID);
    waitForTopologyNodeById(CUDN_NODE_ID);
    waitForTopologyNodeById(NAD_CNV_BRIDGE_NODE_ID);

    visitAllNamespacesTopology('?resourceTypes=NetworkAttachmentDefinition');
    waitForTopologyPageReady();
    waitForTopologyNodeById(NAD_CNV_BRIDGE_NODE_ID);
    assertTopologyNodeById(NAD_CNV_BRIDGE_NODE_ID);
    assertTopologyNodeById(NAD_OVN_NODE_ID);
    assertTopologyNodeById(NAD_SRIOV_NODE_ID);
    assertTopologyNodeById(UDN_NAD_NODE_ID);
    assertTopologyNodeHiddenById(UDN_NODE_ID);
    assertTopologyNodeHiddenById(CUDN_NODE_ID);
  });

  it('shows edges between a UDN and its matching NAD', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(UDN_NODE_ID);
    waitForTopologyNodeById(UDN_NAD_NODE_ID);
    searchTopology(UDN_NAME);
    assertTopologyNodeById(UDN_NODE_ID);
    assertTopologyNodeById(UDN_NAD_NODE_ID);
    assertTopologyEdgeBetween(UDN_NODE_ID, UDN_NAD_NODE_ID);
    clearTopologySearch();
  });

  it('shows edges between a CUDN and its bridge NAD', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(CUDN_NODE_ID);
    waitForTopologyNodeById(CUDN_NAD_NODE_ID);
    searchTopology(CUDN_NAME);
    assertTopologyNodeById(CUDN_NODE_ID);
    assertTopologyNodeById(CUDN_NAD_NODE_ID);
    assertTopologyEdgeBetween(CUDN_NODE_ID, CUDN_NAD_NODE_ID);
    clearTopologySearch();
  });

  it('selects a NAD node when clicked on the canvas', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(NAD_CNV_BRIDGE_NODE_ID);
    searchTopology(NAD_CNV_BRIDGE);
    clickTopologyNodeById(NAD_CNV_BRIDGE_NODE_ID);
    assertTopologyNodeSelectedById(NAD_CNV_BRIDGE_NODE_ID);
  });

  it('can filter to a single NAD type via the resource filter', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(UDN_NODE_ID);
    waitForTopologyNodeById(NAD_OVN_NODE_ID);
    filterTopologyByResourceType('NetworkAttachmentDefinition');
    assertTopologyNodeById(NAD_OVN_NODE_ID);
    assertTopologyNodeById(NAD_SRIOV_NODE_ID);
    assertTopologyNodeHiddenById(UDN_NODE_ID);
  });
});
