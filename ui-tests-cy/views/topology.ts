import { getPublicEnv } from '../support/env';
import { MINUTE } from '../utils/const/base';
import { ALL_NAMESPACES_TOPOLOGY_PATH, namespacedTopologyPath } from '../utils/const/topology';
// Matches OpenShift console 404 / plugin-missing states. When the
// networking-topology plugin route is not registered on the cluster (e.g.
// uit-510-hot-ci) the console renders a 404 shell — detect it quickly and
// skip instead of timing out 240s on page load plus 120s per selector.
const TOPOLOGY_UNAVAILABLE_RE =
  /404|Page not found|We did not find|Extension not found|Unable to load|Not Found/i;

const isBodyShowingTopology = ($body: JQuery<HTMLElement>): boolean => {
  const hasH1 = $body
    .find('h1')
    .toArray()
    .some((el) => (el.textContent ?? '').includes('Topology'));
  const hasGraph = $body.find('#topology-display-graph, .pf-topology-container').length > 0;
  return hasH1 || hasGraph;
};

const isBodyShowing404 = ($body: JQuery<HTMLElement>): boolean => {
  const text = $body.text();
  if (TOPOLOGY_UNAVAILABLE_RE.test(text)) return true;
  return $body
    .find('[data-test="404-page"], h1, h2')
    .toArray()
    .some((el) => TOPOLOGY_UNAVAILABLE_RE.test(el.textContent ?? ''));
};

const skipCurrentTest = (reason: string): void => {
  cy.log(`Topology unavailable — skipping: ${reason}`);
  cy.wrap(null, { log: false }).then(function () {
    // Work for both `function () {}` suites (lexical this) and arrow-function
    // callers: try Cypress runner state first, fall back to Mocha context.
    const fromState = (
      cy as unknown as { state: (k: string) => { ctx?: Mocha.Context } | undefined }
    ).state('runnable')?.ctx;
    const fromRunner = (
      Cypress as unknown as {
        mocha: { getRunner: () => { suite: { ctx: Mocha.Context } } };
      }
    ).mocha?.getRunner?.()?.suite?.ctx;
    const ctx = fromState ?? fromRunner ?? (this as unknown as Mocha.Context);
    if (ctx?.skip) ctx.skip();
  });
};

const skipIfTopologyUnavailable = (): void => {
  // Poll briefly (up to ~15s) for a 404/empty state without failing the test
  // if the topology is just slow. If topology appears, stop probing; if 404
  // appears, skip. After the poll window, let the caller proceed to its
  // normal long wait (2×MINUTE) which handles slow clusters.
  const poll = (remaining: number): void => {
    cy.get('body', { log: false }).then(($body) => {
      if (isBodyShowingTopology($body)) return;
      if (isBodyShowing404($body)) {
        skipCurrentTest('networking-topology plugin route not available (404)');
        return;
      }
      if (remaining <= 0) return;
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000, { log: false }).then(() => poll(remaining - 1));
    });
  };
  poll(5);
};

const topologySearch = () =>
  cy.byLegacyTestID('topology-search').find('input', { timeout: 2 * MINUTE });

const topologyResourceFilter = () => cy.byLegacyTestID('topology-resource-filter');

export const visitAllNamespacesTopology = (query = ''): void => {
  cy.visit(`${ALL_NAMESPACES_TOPOLOGY_PATH}${query}`, {
    failOnStatusCode: false,
    timeout: 2 * MINUTE,
  });
  cy.dismissWelcomeTourIfPresent();
  skipIfTopologyUnavailable();
  waitForTopologyPageReady();
};

export const visitNamespacedTopology = (namespace: string, query = ''): void => {
  cy.visit(`${namespacedTopologyPath(namespace)}${query}`, {
    failOnStatusCode: false,
    timeout: 2 * MINUTE,
  });
  cy.dismissWelcomeTourIfPresent();
  skipIfTopologyUnavailable();
  waitForTopologyPageReady();
};

export const waitForTopologyPageReady = (): void => {
  cy.get('body', { log: false, timeout: 30000 }).then(($body) => {
    if (!isBodyShowingTopology($body) && isBodyShowing404($body)) {
      skipCurrentTest('networking-topology plugin route not available');
    }
  });
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
  // Selection is applied by patternfly-topology to the node element inside the
  // data-id wrapper, so accept the class on the wrapper or any descendant.
  cy.get(`[data-id="${nodeId}"]`, { timeout: MINUTE }).should(($node) => {
    const selected = $node.is('.pf-m-selected') || $node.find('.pf-m-selected').length > 0;
    expect(selected, `node ${nodeId} selected`).to.be.true;
  });
};

export const assertTopologyEdgeBetween = (sourceId: string, targetId: string): void => {
  const edgeId = `${sourceId}-to-${targetId}`;
  cy.get(`[data-id="${edgeId}"]`, { timeout: 2 * MINUTE }).should('exist');
};

export const filterTopologyByResourceType = (resourceTypeLabel: string): void => {
  topologyResourceFilter().click();
  // PF SelectOption with hasCheckbox carries no ARIA role; address the item
  // through its menu-item class instead.
  cy.contains('.pf-v6-c-menu__item', resourceTypeLabel, {
    matchCase: false,
    timeout: MINUTE,
  }).click();
  // Close the select by clicking the toggle again.
  topologyResourceFilter().click();
};

export const waitForTopologyNodeById = (nodeId: string): void => {
  cy.get(`[data-id="${nodeId}"]`, { timeout: 5 * MINUTE }).should('exist');
};

export const waitForManagedNad = (name: string, namespace: string): void => {
  // OVN-Kubernetes > 4.18 names a CUDN-managed NAD after the CUDN itself;
  // older versions prefix it with 'cluster.udn.'. Accept either.
  const candidates = [name, `cluster.udn.${name}`];
  cy.exec(
    `bash -c 'for i in $(seq 1 24); do for n in ${candidates.join(' ')}; do oc get network-attachment-definitions.k8s.cni.cncf.io "$n" -n ${namespace} >/dev/null 2>&1 && { echo "found $n"; exit 0; }; done; sleep 5; done; echo "timed out waiting for managed NAD ${namespace}/${name}" >&2; exit 1'`,
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

// ---------------------------------------------------------------------------

const PROTOTYPE_REACHABLE = getPublicEnv('PROTOTYPE_TOPOLOGY_REACHABLE');

const isPrototypeSkipped = PROTOTYPE_REACHABLE === 'false';

/**
 * The prototype lives on an external host (vercel). CI agents without external
 * egress time out loading it for the full pageLoadTimeout; skip those specs
 * instead of failing. Reachability is probed once per run via cy.request.
 */
export const prototypeDescribe = (name: string, fn: () => void): void => {
  (isPrototypeSkipped ? describe.skip : describe)(name, function () {
    before(function () {
      cy.request({
        failOnStatusCode: false,
        timeout: 30000,
        url: PROTOTYPE_TOPOLOGY_URL,
      }).then((res) => {
        if (res.status >= 400) {
          cy.log(`Prototype unreachable (status ${res.status}) — skipping ${name}`);
          cy.wrap(null).then(() => this.skip());
        }
      });
    });
    fn();
  });
};
