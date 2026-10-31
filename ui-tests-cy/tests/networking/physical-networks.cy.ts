import { adminOnlyDescribe, TEST_NS } from '../../utils/const/base';
import {
  anyNodeMatchesSeededSelector,
  CLUSTER_WRITES_ALLOWED,
  createLocalnetNAD,
  createSeededPolicy,
  deleteLocalnetNAD,
  deleteSeededPolicy,
  getNMStateReadiness,
  LOCALNET_NAD_NAME,
  type NMStateReadiness,
  PHYSICAL_NETWORK_NAME,
  SEEDED_POLICY_NAME,
} from '../../views/physical-networks';

const SEARCH_INPUT = '.physical-networks-table__search-input input';
const SEEDED_DESCRIPTION = 'e2e physical network policy';
const CLUSTER_DEFAULT_NETWORK = "Cluster's default network";
const NO_DATA_DASH = '-';

const rowForPhysicalNetwork = () =>
  cy.get('td[data-label="Network name"]').contains(PHYSICAL_NETWORK_NAME).parents('tr');

let nadCreated = false;
let policyCreated = false;
let readiness: NMStateReadiness = 'unreadable';

before(() => {
  // Sets the csrf-token cookie the write helpers send; the page watch needs no extra auth.
  cy.request('/');
  getNMStateReadiness().then((value) => {
    readiness = value;
  });
  createLocalnetNAD().then((result) => {
    nadCreated = result === 'created';
  });
});

after(() => {
  if (policyCreated) deleteSeededPolicy();
  if (nadCreated) deleteLocalnetNAD();
});

adminOnlyDescribe('Physical networks page: localnet reference', () => {
  before(function () {
    if (!nadCreated) this.skip();
  });

  it('lists the physical network referenced by a localnet NAD', () => {
    cy.visitPhysicalNetworks();

    cy.get('[data-test-id="physical-networks-nav-item"]').should('exist');
    rowForPhysicalNetwork().should('have.length', 1);
    rowForPhysicalNetwork().within(() => {
      cy.get('td[data-label="Network name"]').should('have.text', PHYSICAL_NETWORK_NAME);
      cy.get('td[data-label="Referenced by"]').should('have.text', '1');
      cy.get('td[data-label="Observed mapping"]').should('have.text', NO_DATA_DASH);
    });

    rowForPhysicalNetwork().find('button[aria-label="Details"]').click();

    cy.contains('h4', 'Network definitions').should('be.visible');
    cy.contains('h4', 'Network definitions')
      .parent()
      .within(() => {
        cy.contains('a', LOCALNET_NAD_NAME)
          .should('have.attr', 'href')
          .and('contain', `/k8s/ns/${TEST_NS}/`);
        cy.contains('td', TEST_NS).should('be.visible');
        cy.contains('td', '400').should('be.visible');
        cy.contains('td', '1500').should('be.visible');
        cy.contains('button', '0 consumers').click();
      });

    cy.get('[aria-label="Consumers modal"]').should('be.visible');
    cy.contains('[aria-label="Consumers modal"]', `Consumers of ${LOCALNET_NAD_NAME}`).should(
      'be.visible',
    );
    cy.get('[aria-label="Consumers modal"] button[aria-label="Close"]').click();
    cy.get('[aria-label="Consumers modal"]').should('not.exist');

    cy.get(SEARCH_INPUT).clear();
    cy.get(SEARCH_INPUT).type('no-such-physical-network');
    cy.contains('No physical networks match the search.').should('be.visible');
    cy.get(SEARCH_INPUT).clear();
    rowForPhysicalNetwork().should('exist');

    cy.get('[data-test-id="physical-networks-scope-select"]').click();
    cy.contains('button', TEST_NS).click();
    cy.contains(
      `Showing network definitions and consumers in project ${TEST_NS}. NMState configuration is cluster-wide.`,
    ).should('be.visible');
    rowForPhysicalNetwork().should('exist');
    cy.get('[data-test-id="physical-networks-scope-select"]').click();
    cy.contains('button', 'All projects').click();
  });
});

adminOnlyDescribe('Physical networks page: NMState detected', () => {
  before(function () {
    if (!nadCreated || readiness !== 'installed') this.skip();
  });

  it('reports configuration data instead of the NMState install guidance', () => {
    cy.visitPhysicalNetworks();

    cy.contains('h2', 'Manage host-network configuration with NMState').should('not.exist');
    rowForPhysicalNetwork().within(() => {
      cy.get('td[data-label="Desired configuration"]')
        .invoke('text')
        .should('match', /^(Not configured|\d+)$/);
    });
  });
});

adminOnlyDescribe('Physical networks page: NMState missing', () => {
  before(function () {
    if (readiness !== 'absent') this.skip();
  });

  it('explains how to install NMState instead of showing configuration data', () => {
    cy.visitPhysicalNetworks();

    cy.contains('h2', 'Manage host-network configuration with NMState').should('be.visible');
    cy.contains(
      'Install the Kubernetes NMState Operator to configure node networks and view policy rollout status. Existing host networking may already be configured through other tools.',
    ).should('be.visible');
    cy.contains('a', 'Install NMState Operator')
      .should('have.attr', 'href')
      .and('contain', '/operatorhub/all-namespaces?keyword=nmstate');
    cy.contains('a', 'View documentation').should('exist');

    cy.get('body').then(($body) => {
      if ($body.find('td[data-label="Desired configuration"]').length > 0) {
        cy.get('td[data-label="Desired configuration"]').each(($cell) => {
          expect($cell.text()).to.eq(NO_DATA_DASH);
        });
      }
    });
  });
});

adminOnlyDescribe('Physical networks page: NMState configuration', () => {
  before(function () {
    if (!nadCreated || readiness !== 'installed' || !CLUSTER_WRITES_ALLOWED) this.skip();

    anyNodeMatchesSeededSelector().then((matches) => {
      expect(matches, 'the seeded node selector must match no node').to.be.false;
    });
    createSeededPolicy().then((result) => {
      policyCreated = result === 'created';
      if (!policyCreated) this.skip();
    });
  });

  it('merges the policy that bridges the physical network into its row', () => {
    cy.visitPhysicalNetworks();

    rowForPhysicalNetwork().should('have.length', 1);
    rowForPhysicalNetwork().within(() => {
      cy.get('td[data-label="Desired configuration"]').should('have.text', '1');
    });

    rowForPhysicalNetwork().find('button[aria-label="Details"]').click();

    cy.contains('h4', 'Configurations').should('be.visible');
    cy.contains('h4', 'Configurations')
      .parent()
      .within(() => {
        cy.contains('td', SEEDED_DESCRIPTION).should('be.visible');
        cy.contains('td', CLUSTER_DEFAULT_NETWORK).should('be.visible');
        cy.contains('td', '1500').should('be.visible');
        cy.contains('button', SEEDED_POLICY_NAME).click();
      });

    cy.get('[aria-label="Configuration drawer"]').should('be.visible');
    cy.contains('[aria-label="Configuration drawer"]', 'Network name').should('be.visible');
    cy.contains('[aria-label="Configuration drawer"]', PHYSICAL_NETWORK_NAME).should('be.visible');
    cy.contains('[aria-label="Configuration drawer"]', SEEDED_DESCRIPTION).should('be.visible');
    cy.contains('[aria-label="Configuration drawer"]', CLUSTER_DEFAULT_NETWORK).should(
      'be.visible',
    );

    cy.get('[aria-label="Configuration drawer"]').contains('button', 'Enactment state').click();
    cy.get('[aria-label="Configuration drawer"] input[aria-label="Filter nodes"]').should('exist');

    cy.get('[aria-label="Configuration drawer"] button[aria-label="Close"]').click();
    cy.get('[aria-label="Configuration drawer"]').should('not.exist');
  });
});
