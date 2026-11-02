import {
  expectPrototypeDrawerText,
  openPrototypeDrawer,
  prototypeDrawer,
  selectPrototypeDrawerTab,
  visitPrototypeTopology,
} from '../../views/topology';

describe('OCPNETUI-138: Network topology resource details drawer', () => {
  beforeEach(() => {
    visitPrototypeTopology();
    openPrototypeDrawer('br-ex');
  });

  it('opens the drawer with resource header and tab navigation', () => {
    prototypeDrawer().should('be.visible').and('contain.text', 'br-ex');
    ['Details', 'Network path', 'Resources', 'Observe'].forEach((tab) => {
      prototypeDrawer().contains('[role="tab"]', tab).should('be.visible');
    });
    prototypeDrawer().find('button[aria-label^="Actions for"]').should('be.visible');
    prototypeDrawer().find('button[aria-label="Close inspector"]').should('be.visible');
  });

  it('shows Details tab fields for the selected resource', () => {
    selectPrototypeDrawerTab('Details');
    expectPrototypeDrawerText(
      'Kind',
      'Bridge',
      'Status',
      'Worker node',
      'Description',
      'Managed by',
      'Related resources',
    );
  });

  it('shows Network path stack and path summary', () => {
    selectPrototypeDrawerTab('Network path');
    expectPrototypeDrawerText(
      'Path summary',
      'Component stack',
      'Physical NIC',
      'External network bridge',
      'Highlight path on graph',
    );
  });

  it('shows Resources tab connections and mappings', () => {
    selectPrototypeDrawerTab('Resources');
    expectPrototypeDrawerText(
      'Connected interfaces',
      'Worker mapping',
      'Parent worker',
      'Peers on this node',
      'Bridge / NAD mapping',
    );
  });

  it('shows Observe tab health and metrics', () => {
    selectPrototypeDrawerTab('Observe');
    expectPrototypeDrawerText('Metrics', 'RX rate', 'TX rate', 'Packet drops', 'Last scrape');
  });

  it('lists resource actions in the Actions menu', () => {
    prototypeDrawer().find('button[aria-label^="Actions for"]').click();
    [
      'View YAML',
      'Configure',
      'Assess delete impact with AI',
      'Pause',
      'Stop',
      'Restart',
      'Delete',
    ].forEach((action) => {
      cy.contains('.pf-v6-c-menu__item, [role="menuitem"]', action).should('be.visible');
    });
  });

  it('shows configuration alerts for a failed resource', () => {
    openPrototypeDrawer('gene_134');
    prototypeDrawer()
      .should('be.visible')
      .and('contain.text', 'gene_134')
      .and('contain.text', 'Configuration failed')
      .and('contain.text', 'Review configuration policy');
    prototypeDrawer().find('.pf-v6-c-alert').should('be.visible');
  });

  it('closes the drawer from the inspector close button', () => {
    prototypeDrawer().find('button[aria-label="Close inspector"]').click();
    prototypeDrawer().should('not.be.visible');
    cy.get('.pf-m-selected.ocs-pf-topo-node--kind-bridge').should('not.exist');
  });
});
