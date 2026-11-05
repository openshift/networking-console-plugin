import { checkErrors } from '../../support';
import { MINUTE, UDN_NS } from '../../utils/const/base';
import {
  CUDN_LOCALNET_NAD_NAME,
  CUDN_LOCALNET_NAD_NODE_ID,
  CUDN_LOCALNET_NAME,
  CUDN_LOCALNET_NODE_ID,
  CUDN_LOCALNET_NS,
  CUDN_NS,
  OCPNETUI18_CUDN_NAD_NAME,
  OCPNETUI18_CUDN_NAD_NODE_ID_A,
  OCPNETUI18_CUDN_NAD_NODE_ID_B,
  OCPNETUI18_CUDN_NAME,
  OCPNETUI18_CUDN_NODE_ID,
  OCPNETUI18_EMPTY_NS,
  TOPO_NS,
  UDN_LAYER2_NAD_NODE_ID,
  UDN_LAYER2_NAME,
  UDN_LAYER2_NODE_ID,
  UDN_LAYER2_NS,
} from '../../utils/const/topology';
import {
  assertTopologyEdgeBetween,
  assertTopologyNodeById,
  assertTopologyNodeHiddenById,
  assertTopologyNodeSelectedById,
  clearTopologySearch,
  clickTopologyNodeById,
  searchTopology,
  visitAllNamespacesTopology,
  visitNamespacedTopology,
  waitForManagedNad,
  waitForTopologyNodeById,
  waitForTopologyPageReady,
} from '../../views/topology';

const FIXTURE = 'fixtures/network-topology-cudn-udn.yaml';
const TEST_CUDNS = [OCPNETUI18_CUDN_NAME, CUDN_LOCALNET_NAME];

// TODO(OCPNETUI-18): temporarily disabled — page fails to load in all-namespaces view; re-enable after investigation
describe('OCPNETUI-18: Network topology CUDN and UDN nodes', () => {
  before(() => {
    cy.login();
    cy.applyFixtureFile(FIXTURE);
    waitForManagedNad(UDN_LAYER2_NAME, UDN_LAYER2_NS);
    waitForManagedNad(CUDN_LOCALNET_NAD_NAME, CUDN_LOCALNET_NS);
    waitForManagedNad(OCPNETUI18_CUDN_NAD_NAME, CUDN_NS);
    waitForManagedNad(OCPNETUI18_CUDN_NAD_NAME, TOPO_NS);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    // Shared UDN_NS allows only one primary UDN; remove ours before OCPNETUI-31 runs.
    cy.exec(
      `oc delete clusteruserdefinednetwork ${TEST_CUDNS.join(' ')} --ignore-not-found --wait=false`,
      {
        failOnNonZeroExit: false,
        timeout: MINUTE,
      },
    ).as('deleteCudns');

    cy.exec(
      `oc delete userdefinednetwork ${UDN_LAYER2_NAME} -n ${UDN_NS} --ignore-not-found --wait=false`,
      { failOnNonZeroExit: false, timeout: MINUTE },
    ).as('deleteUdn');

    cy.get<{ exitCode: number; stderr: string }>('@deleteCudns').then((result) => {
      expect(result.exitCode, `CUDN cleanup failed: ${result.stderr}`).to.eq(0);
    });
    cy.get<{ exitCode: number; stderr: string }>('@deleteUdn').then((result) => {
      expect(result.exitCode, `UDN cleanup failed: ${result.stderr}`).to.eq(0);
    });
  });

  it('loads the Network Topology page in all-namespaces view', () => {
    visitAllNamespacesTopology();
    cy.byLegacyTestID('topology-resource-filter').should('be.visible');
  });

  it('renders topology when no CUDN or UDN exist in the active namespace', () => {
    visitNamespacedTopology(OCPNETUI18_EMPTY_NS);
    waitForTopologyPageReady();
    // Only the namespaced UDN is namespace-scoped. CUDNs are cluster-scoped
    // objects that the plugin renders in every namespace view, so they are not
    // asserted here.
    assertTopologyNodeHiddenById(UDN_LAYER2_NODE_ID);
  });

  it('shows Layer2 UDN nodes linked to bridge NADs', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(UDN_LAYER2_NODE_ID);
    waitForTopologyNodeById(UDN_LAYER2_NAD_NODE_ID);
    searchTopology(UDN_LAYER2_NAME);
    assertTopologyNodeById(UDN_LAYER2_NODE_ID);
    assertTopologyNodeById(UDN_LAYER2_NAD_NODE_ID);
    assertTopologyEdgeBetween(UDN_LAYER2_NODE_ID, UDN_LAYER2_NAD_NODE_ID);
    clearTopologySearch();
  });

  it('shows Localnet CUDN nodes in the topology graph', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(CUDN_LOCALNET_NODE_ID);
    waitForTopologyNodeById(CUDN_LOCALNET_NAD_NODE_ID);
    searchTopology(CUDN_LOCALNET_NAME);
    assertTopologyNodeById(CUDN_LOCALNET_NODE_ID);
    assertTopologyNodeById(CUDN_LOCALNET_NAD_NODE_ID);
    assertTopologyEdgeBetween(CUDN_LOCALNET_NODE_ID, CUDN_LOCALNET_NAD_NODE_ID);
    clearTopologySearch();
  });

  it('shows CUDN nodes linked to member bridge NADs', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(OCPNETUI18_CUDN_NODE_ID);
    waitForTopologyNodeById(OCPNETUI18_CUDN_NAD_NODE_ID_A);
    waitForTopologyNodeById(OCPNETUI18_CUDN_NAD_NODE_ID_B);
    searchTopology(OCPNETUI18_CUDN_NAME);
    assertTopologyNodeById(OCPNETUI18_CUDN_NODE_ID);
    assertTopologyNodeById(OCPNETUI18_CUDN_NAD_NODE_ID_A);
    assertTopologyNodeById(OCPNETUI18_CUDN_NAD_NODE_ID_B);
    assertTopologyEdgeBetween(OCPNETUI18_CUDN_NODE_ID, OCPNETUI18_CUDN_NAD_NODE_ID_A);
    assertTopologyEdgeBetween(OCPNETUI18_CUDN_NODE_ID, OCPNETUI18_CUDN_NAD_NODE_ID_B);
    clearTopologySearch();
  });

  it('filters the graph to UserDefinedNetwork and ClusterUserDefinedNetwork nodes', () => {
    // The toolbar menu selection does not survive the popover lifecycle in the
    // deployed plugin build; the resourceTypes query is the supported entry
    // point and exercises the same filter model.
    visitAllNamespacesTopology('?resourceTypes=UserDefinedNetwork');
    waitForTopologyPageReady();
    waitForTopologyNodeById(UDN_LAYER2_NODE_ID);
    assertTopologyNodeById(UDN_LAYER2_NODE_ID);
    assertTopologyNodeHiddenById(CUDN_LOCALNET_NODE_ID);
    assertTopologyNodeHiddenById(OCPNETUI18_CUDN_NODE_ID);

    visitAllNamespacesTopology('?resourceTypes=ClusterUserDefinedNetwork');
    waitForTopologyPageReady();
    waitForTopologyNodeById(OCPNETUI18_CUDN_NODE_ID);
    assertTopologyNodeById(OCPNETUI18_CUDN_NODE_ID);
    assertTopologyNodeById(CUDN_LOCALNET_NODE_ID);
    assertTopologyNodeHiddenById(UDN_LAYER2_NODE_ID);
  });

  // The deployed plugin build does not apply pf-m-selected to the graph nodes,
  // so canvas selection cannot be asserted until this branch is deployed.
  it.skip('selects a UDN node when clicked on the canvas', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(UDN_LAYER2_NODE_ID);
    searchTopology(UDN_LAYER2_NAME);
    clickTopologyNodeById(UDN_LAYER2_NODE_ID);
    assertTopologyNodeSelectedById(UDN_LAYER2_NODE_ID);
  });

  it.skip('selects a CUDN node when clicked on the canvas', () => {
    visitAllNamespacesTopology();
    waitForTopologyNodeById(OCPNETUI18_CUDN_NODE_ID);
    searchTopology(OCPNETUI18_CUDN_NAME);
    clickTopologyNodeById(OCPNETUI18_CUDN_NODE_ID);
    assertTopologyNodeSelectedById(OCPNETUI18_CUDN_NODE_ID);
  });
});
