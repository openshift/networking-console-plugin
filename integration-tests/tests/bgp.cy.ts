import { checkErrors } from '../support';
import { MINUTE } from '../support/commands';
import { expectYamlToContain, switchToYamlView } from '../support/service-form';

const CLOUD_CREATE_URL =
  '/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration/~new/form';
const ROUTING_CREATE_URL = '/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting/~new/form';
const BGP_CARD_CUDN_URL = '/k8s/cluster/k8s.ovn.org~v1~ClusterUserDefinedNetwork/e2e-bgp-card-cudn';
const BGP_CARD_FIXTURE = 'fixtures/bgp-routing-card.yaml';

const selectFormEditor = () => {
  cy.get('#form', { timeout: MINUTE }).check({ force: true });
};

const switchBGPFormView = (fieldId: string) => {
  cy.contains('label', 'Form view').click();
  cy.get(`#${fieldId}`, { timeout: MINUTE }).should('be.visible');
};

describe('BGP forms', () => {
  before(() => {
    cy.login();
    cy.applyFixtureFile(BGP_CARD_FIXTURE);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.exec(
      'oc delete bgprouting e2e-bgp-card-routing --ignore-not-found && ' +
        'oc delete clusteruserdefinednetwork e2e-bgp-card-cudn --ignore-not-found && ' +
        'oc delete namespace e2e-bgp-card-ns --ignore-not-found --wait=false',
      { failOnNonZeroExit: false, timeout: MINUTE },
    );
    cy.logout();
  });

  it('shows typed cloud fields and only the selected platform section', () => {
    cy.visit(CLOUD_CREATE_URL);
    cy.contains('h1', 'Create BGPCloudConfiguration', { timeout: MINUTE }).should('be.visible');
    selectFormEditor();

    cy.get('#name').should('be.disabled');
    cy.get('#name').should('have.value', 'cluster');
    cy.get('#localASN').should('have.attr', 'type', 'text');
    cy.get('#localASN').type('abc');
    cy.contains('Enter a valid ASN between 1 and 4294967295.').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('#localASN').clear();
    cy.get('#localASN').type('64512');
    cy.get('#awsRegion').should('be.visible');
    cy.get('#awsRouteServerIDs').should('be.visible');
    cy.get('#azureSubscriptionID').should('not.exist');
    cy.get('#enableNestedVirtualization').should('not.exist');

    cy.get('#platform').click();
    cy.contains('[role="menuitem"]', 'Azure').click();
    cy.get('#azureSubscriptionID').should('be.visible');
    cy.get('#azureResourceGroup').should('be.visible');
    cy.get('#azureRouteServerName').should('be.visible');
    cy.get('#awsRegion').should('not.exist');

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
    cy.get('#remoteASN').type('4294967296');
    cy.contains('Enter a valid ASN between 1 and 4294967295.').should('be.visible');
    cy.get('#remoteASN').clear();
    cy.get('#remoteASN').type('64513');
    cy.get('#ebgpMultiHop').should('have.attr', 'type', 'checkbox');
  });

  it('allows selector labels with an empty value', () => {
    cy.visit(CLOUD_CREATE_URL);
    selectFormEditor();

    cy.get('#localASN').type('64512');
    cy.get('#platform').click();
    cy.contains('[role="menuitem"]', 'Manual').click();
    cy.get('#peerSelectorKey').type('k8s.ovn.org/primary-user-defined-network');
    cy.get('#peerSelectorValue').should('have.value', '');
    cy.get('#neighborAddress').type('192.0.2.1');
    cy.get('#remoteASN').type('64513');
    cy.get('#routerSelectorKey').type('node-role.kubernetes.io/bgp');
    cy.get('#routerSelectorValue').should('have.value', '');

    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('supports switching between the guided form and YAML editor', () => {
    cy.visit(CLOUD_CREATE_URL);
    selectFormEditor();
    cy.get('#localASN').type('64512');
    cy.get('#platform').click();
    cy.contains('[role="menuitem"]', 'Manual').click();
    cy.get('#peerSelectorKey').type('node-role.kubernetes.io/bgp');
    cy.get('#neighborAddress').type('192.0.2.1');
    cy.get('#remoteASN').type('64513');
    cy.get('#routerSelectorKey').type('node-role.kubernetes.io/worker');

    switchToYamlView();
    expectYamlToContain(
      'kind: BGPCloudConfiguration',
      'platform: Manual',
      'localASN: 64512',
      'address: 192.0.2.1',
    );
    switchBGPFormView('localASN');
    cy.get('#localASN').should('have.value', '64512');
    cy.get('#platform').should('contain', 'Manual');
    cy.get('#neighborAddress').should('have.value', '192.0.2.1');
  });

  it('supports switching between the BGPRouting form and YAML editor', () => {
    cy.visit(ROUTING_CREATE_URL);
    selectFormEditor();
    cy.get('#name').type('e2e-routing');
    cy.get('#network').type('e2e-network');
    cy.get('#subnet1').type('10.20.0.0/16');
    cy.get('#subnet2').type('2001:db8:20::/64');

    switchToYamlView();
    expectYamlToContain(
      'kind: BGPRouting',
      'name: e2e-routing',
      'name: e2e-network',
      '10.20.0.0/16',
      '2001:db8:20::/64',
    );
    switchBGPFormView('name');
    cy.get('#name').should('have.value', 'e2e-routing');
    cy.get('#network').should('have.value', 'e2e-network');
    cy.get('#subnet1').should('have.value', '10.20.0.0/16');
    cy.get('#subnet2').should('have.value', '2001:db8:20::/64');
  });

  it('shows the routing tab disabled until a cloud configuration exists', () => {
    cy.visit('/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration');
    cy.contains('h1', 'BGP', { timeout: MINUTE }).should('be.visible');
    cy.get('button[role="tab"]', { timeout: MINUTE })
      .contains('BGPRouting')
      .should(($tab) => {
        const configurationExists =
          $tab.closest('body').find('a[href*="BGPCloudConfiguration/"]').length > 0;
        if (configurationExists) {
          expect($tab).not.to.be.disabled;
        } else {
          expect($tab).to.be.disabled;
        }
      });
  });

  it('validates BGPRouting CIDRs and refreshes namespace guidance', () => {
    cy.visit(ROUTING_CREATE_URL);
    cy.contains('h1', 'Create BGPRouting', { timeout: MINUTE }).should('be.visible');
    selectFormEditor();

    cy.get('#name').should('have.attr', 'type', 'text').type('e2e-routing-validation');
    cy.get('#network').type('prod');
    cy.contains('code', 'cluster-udn=prod').should('be.visible');
    cy.get('#subnet1').type('abc.def/24');
    cy.contains('Enter a valid IPv4 or IPv6 CIDR.').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');

    cy.get('#subnet1').clear();
    cy.get('#subnet1').type('10.20.0.0/16');
    cy.get('#subnet2').type('2001:db8:20::/64');
    cy.get('#subnet3').should('not.exist');
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('exposes a name filter on the BGPRouting list view', () => {
    cy.visit('/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration');
    cy.contains('h1', 'BGP', { timeout: MINUTE }).should('be.visible');

    cy.visit('/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting');
    cy.get('body', { timeout: MINUTE })
      .should(($body) => {
        expect(
          $body.find('[data-test-id="item-filter"]').length ||
            $body.find(':contains("No BGPRouting found")').length,
        ).to.be.greaterThan(0);
      })
      .then(($body) => {
        if ($body.find('[data-test-id="item-filter"]').length) {
          cy.get('[data-test-id="item-filter"]').should('be.visible');
        } else cy.contains('No BGPRouting found').should('be.visible');
      });
  });

  it('shows related BGPRouting details on the CUDN page', () => {
    cy.visit(BGP_CARD_CUDN_URL);
    cy.contains('h1', 'e2e-bgp-card-cudn', { timeout: MINUTE }).should('be.visible');
    cy.contains('h2', 'BGP routings', { timeout: MINUTE }).scrollIntoView();
    cy.contains('h2', 'BGP routings', { timeout: MINUTE }).should('be.visible');
    cy.contains('a', 'e2e-bgp-card-routing').should('be.visible');
    cy.contains('Network').should('be.visible');
    cy.contains('e2e-bgp-card-cudn').should('be.visible');
    cy.contains('Phase').should('be.visible');
    cy.contains('Availability').should('be.visible');
  });
});
