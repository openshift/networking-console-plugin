import { checkErrors } from '../support';
import { MINUTE } from '../support/commands';

const CLOUD_CREATE_URL =
  '/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration/~new/form';
const ROUTING_CREATE_URL = '/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting/~new/form';

const selectFormEditor = () => {
  cy.get('#form', { timeout: MINUTE }).check({ force: true });
};

describe('BGP forms', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('shows typed cloud fields and only the selected platform section', () => {
    cy.visit(CLOUD_CREATE_URL);
    cy.contains('h1', 'Create BGPCloudConfiguration', { timeout: MINUTE }).should('be.visible');
    selectFormEditor();

    cy.get('#name').should('be.disabled');
    cy.get('#name').should('have.value', 'cluster');
    cy.get('#localASN').should('have.attr', 'type', 'text');
    cy.get('#awsRegion').should('be.visible');
    cy.get('#awsRouteServerIDs').should('be.visible');
    cy.get('#azureSubscriptionID').should('not.exist');
    cy.get('#enableNestedVirtualization').should('not.exist');

    cy.get('#platform').click();
    cy.contains('[role="menuitem"]', 'GCP').click();
    cy.get('#gcpProject').should('be.visible');
    cy.get('#gcpRegion').should('be.visible');
    cy.get('#cloudRouterName').should('be.visible');
    cy.get('#enableNestedVirtualization').should('have.attr', 'type', 'checkbox');
    cy.get('#awsRegion').should('not.exist');

    cy.get('#platform').click();
    cy.contains('[role="menuitem"]', 'Manual').click();
    cy.get('#peerSelectorKey').should('be.visible');
    cy.get('#peerSelectorValue').should('be.visible');
    cy.get('#neighborAddress').should('be.visible');
    cy.get('#remoteASN').should('have.attr', 'type', 'text');
    cy.get('#ebgpMultiHop').should('have.attr', 'type', 'checkbox');
  });

  it('supports switching between the guided form and YAML editor', () => {
    cy.visit(CLOUD_CREATE_URL);
    selectFormEditor();
    cy.get('#yaml').check({ force: true });
    cy.get('.monaco-editor', { timeout: MINUTE }).should('be.visible');
    cy.get('#form').check({ force: true });
    cy.get('#localASN').should('be.visible');
  });

  it('validates BGPRouting CIDRs and refreshes namespace guidance', () => {
    cy.visit(ROUTING_CREATE_URL);
    cy.contains('h1', 'Create BGPRouting', { timeout: MINUTE }).should('be.visible');
    selectFormEditor();

    cy.get('#name').should('have.attr', 'type', 'text');
    cy.get('#network').type('prod');
    cy.contains('code', 'cluster-udn=prod').should('be.visible');
    cy.get('#subnet1').type('not-a-cidr');
    cy.contains('Enter a valid IPv4 or IPv6 CIDR.').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');

    cy.get('#subnet1').clear();
    cy.get('#subnet1').type('10.20.0.0/16');
    cy.get('#subnet2').type('2001:db8:20::/64');
    cy.get('#subnet3').should('not.exist');
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('exposes name filters on both BGP list views', () => {
    cy.visit('/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration');
    cy.get('[data-test-id="item-filter"]', { timeout: MINUTE }).should('be.visible');

    cy.visit('/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting');
    cy.get('[data-test-id="item-filter"]', { timeout: MINUTE }).should('be.visible');
  });
});
