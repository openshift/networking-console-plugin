import { MINUTE } from '../utils/const/base';
import { ALL_NAMESPACES_TOPOLOGY_PATH, namespacedTopologyPath } from '../utils/const/topology';

const topologySearch = () =>
  cy.byLegacyTestID('topology-search').find('input', { timeout: 2 * MINUTE });

const topologyResourceFilter = () => cy.byLegacyTestID('topology-resource-filter');

export const visitAllNamespacesTopology = (query = ''): void => {
  cy.visit(`${ALL_NAMESPACES_TOPOLOGY_PATH}${query}`, {
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

// ---------------------------------------------------------------------------
// Prototype topology UI helpers
// These target the standalone OpenShift platform prototype rather than the
// deployed console plugin, so they use their own URL and selectors.
// ---------------------------------------------------------------------------

const PROTOTYPE_TOPOLOGY_URL =
  'https://openshift-platform-prototype.vercel.app/networking/topology';

export const prototypeSearchInput = () => cy.get('input[aria-label="Search topology resources"]');

export const prototypeFilterToggle = () => cy.get('button[aria-label^="Filter"]');

export const prototypeAdvancedFiltersButton = () =>
  cy.get('button[aria-label="Advanced topology filters"]');

export const prototypeViewToggle = () => cy.get('button[aria-label^="View:"]');

export const prototypeDrawer = () => cy.get('.ocs-pf-topo-sidebar');

export const visitPrototypeTopology = (): void => {
  cy.visit(PROTOTYPE_TOPOLOGY_URL);
  cy.contains('h1', 'Topology').should('be.visible');
  cy.contains('svg text', 'worker-0', { timeout: 30000 }).should('be.visible');
};

export const openPrototypeDisplayOptions = (): void => {
  cy.get('button.ocs-pf-topo-display-toggle').click();
  cy.contains('.pf-v6-c-menu', 'Show labels').should('be.visible');
};

export const openPrototypeViewMenu = (): void => {
  prototypeViewToggle().click();
  cy.contains('[role="option"]', 'Node underlay').should('be.visible');
};

export const closePrototypeViewMenu = (): void => {
  prototypeViewToggle().click();
};

export const selectPrototypeView = (viewName: string): void => {
  openPrototypeViewMenu();
  cy.contains('[role="option"] .pf-v6-c-menu__item-text', new RegExp(`^${viewName}$`)).click();
  prototypeViewToggle().should('have.attr', 'aria-label', `View: ${viewName}`);
};

export const openPrototypeDrawer = (nodeLabel: string): void => {
  cy.contains('.pf-topology__node__label', nodeLabel).first().click({ force: true });
  prototypeDrawer().should('be.visible').and('contain.text', nodeLabel);
};

export const selectPrototypeDrawerTab = (tabName: string): void => {
  prototypeDrawer().contains('[role="tab"]', tabName).click();
  prototypeDrawer().contains('[role="tab"]', tabName).should('have.attr', 'aria-selected', 'true');
};

export const expectPrototypeDrawerText = (...expectedText: string[]): void => {
  const activePanel = () => prototypeDrawer().find('[role="tabpanel"]:not([hidden])');
  activePanel().should('have.length', 1).and('be.visible');
  expectedText.forEach((text) => {
    activePanel().contains(text).scrollIntoView().should('be.visible');
  });
};

export const prototypeSvgText = ($texts: JQuery<HTMLElement>): string[] =>
  [...$texts].map((el) => el.textContent?.trim() ?? '');

export const prototypeWorkerNames = ($texts: JQuery<HTMLElement>): string[] => [
  ...new Set(prototypeSvgText($texts).filter((text) => text.startsWith('worker-'))),
];

const expectPrototypeSvgTexts = (assertion: (texts: string[]) => void): void => {
  cy.get('svg text').should(($texts) => assertion(prototypeSvgText($texts)));
};

export const expectPrototypeSvgText = (name: string): void => {
  expectPrototypeSvgTexts((texts) => expect(texts).to.include(name));
};

export const expectPrototypeSvgTextAbsent = (name: string): void => {
  expectPrototypeSvgTexts((texts) => expect(texts).to.not.include(name));
};
