const TOPOLOGY_URL = 'https://openshift-platform-prototype.vercel.app/networking/topology';

const searchInput = 'input[aria-label="Search topology resources"]';
const filterToggle = 'button[aria-label^="Filter"]';
const displayOptionsToggle = 'button.ocs-pf-topo-display-toggle';
const advancedFiltersButton = 'button[aria-label="Advanced topology filters"]';

const visitTopology = () => {
  cy.visit(TOPOLOGY_URL);
  cy.contains('h1', 'Topology').should('be.visible');
  cy.contains('svg text', 'worker-0', { timeout: 30000 }).should('be.visible');
};

const openDisplayOptions = () => {
  cy.get(displayOptionsToggle).click();
  cy.contains('.pf-v6-c-menu', 'Show labels').should('be.visible');
};

const svgText = ($texts: JQuery<HTMLElement>) =>
  [...$texts].map((el) => el.textContent?.trim() ?? '');

const workerNames = ($texts: JQuery<HTMLElement>) => [
  ...new Set(svgText($texts).filter((text) => text.startsWith('worker-'))),
];

const expectSvgText = (name: string) => {
  cy.get('svg text').should(($texts) => {
    expect(svgText($texts)).to.include(name);
  });
};

const expectNoSvgText = (name: string) => {
  cy.get('svg text').should(($texts) => {
    expect(svgText($texts)).to.not.include(name);
  });
};

describe('Network topology toolbar', () => {
  beforeEach(() => {
    visitTopology();
  });

  it('lists resource types in the filter menu and filters the graph', () => {
    cy.get(filterToggle).should('contain', 'Filter by...').click();
    [
      'All types',
      'Unhealthy',
      'NIC',
      'Bond',
      'VLAN',
      'Linux bridge',
      'OVS bridge',
      'OVN bridge',
      'Tunnel',
      'Port',
    ].forEach((option) => {
      cy.contains('[role="option"]', option).should('be.visible');
    });

    cy.contains('[role="option"]', 'NIC').click();
    cy.get(filterToggle).should('have.attr', 'aria-label', 'Filter: NIC');
    expectSvgText('ens5');
    expectNoSvgText('br-ex');

    cy.get(filterToggle).click();
    cy.contains('[role="option"]', 'All types').click();
    cy.get(filterToggle).should('contain', 'Filter by...');
    cy.contains('svg text', 'br-ex').should('be.visible');
  });

  it('filters the graph from the search bar and clears the query', () => {
    cy.get(searchInput).should('have.attr', 'placeholder', 'Search topology...');
    cy.get(searchInput).type('bond0');
    expectSvgText('bond0');
    expectNoSvgText('br-ex');

    cy.get('.pf-v6-c-text-input-group button[aria-label="Reset"]').click();
    cy.get(searchInput).should('have.value', '');
    cy.contains('svg text', 'br-ex').should('be.visible');

    cy.get(searchInput).type('no-such-resource');
    cy.get('svg text').should('not.exist');
  });

  it('adds and clears an advanced name filter', () => {
    cy.get(advancedFiltersButton).click();
    cy.contains('h6', 'Advanced filter').should('be.visible');
    cy.get('.pf-v6-c-popover').contains('button', 'AND').should('exist');
    cy.get('.pf-v6-c-popover').contains('button', 'OR').should('exist');
    cy.get('.pf-v6-c-popover').find('button.pf-v6-c-menu-toggle').eq(0).click();
    ['Source', 'Destination', 'Namespace', 'Kind', 'IP', 'MAC'].forEach((attribute) => {
      cy.contains('[role="option"]', attribute).should('be.visible');
    });
    cy.contains('[role="option"]', /^Name$/).should('have.class', 'pf-m-selected');
    cy.get('.pf-v6-c-popover').find('button.pf-v6-c-menu-toggle').eq(0).click();

    cy.get('.pf-v6-c-popover').find('button.pf-v6-c-menu-toggle').eq(1).click();
    ['equals', 'not equals'].forEach((operator) => {
      cy.contains('[role="option"]', operator).should('be.visible');
    });
    cy.contains('[role="option"]', /^contains$/).should('have.class', 'pf-m-selected');
    cy.get('.pf-v6-c-popover').find('button.pf-v6-c-menu-toggle').eq(1).click();

    cy.get('input[aria-label="Filter value"]').type('br-int');
    cy.contains('button', 'Add filter').click();

    cy.contains('.pf-v6-c-label', 'Name contains "br-int"').should('be.visible');
    expectSvgText('br-int');
    expectNoSvgText('br-ex');

    cy.contains('button', 'Clear filters').click();
    cy.contains('.pf-v6-c-label', 'Name contains "br-int"').should('not.exist');
    expectSvgText('br-ex');
  });

  it('toggles labels, management ports, compact view, and layout', () => {
    openDisplayOptions();
    cy.contains('label.pf-v6-c-switch', 'Show labels').find('input').should('be.checked');
    cy.contains('label.pf-v6-c-switch', 'Hide management ports')
      .find('input')
      .should('not.be.checked');
    cy.contains('label.pf-v6-c-switch', 'Hide workloads').find('input').should('not.be.checked');
    cy.contains('label.pf-v6-c-switch', 'Compact view').find('input').should('be.checked');
    ['Hierarchical', 'Tree', 'Organic', 'Cluster map', 'Grid', 'Radial', 'Force-directed'].forEach(
      (layout) => {
        cy.contains('label.pf-v6-c-radio__label', layout).should('be.visible');
      },
    );
    cy.get('input[name="topology-layout"]').first().should('be.checked');

    cy.contains('label.pf-v6-c-switch', 'Show labels').click();
    cy.get('.ocs-pf-topo-canvas-wrap--hide-labels').should('exist');
    cy.get('.pf-topology__node__label').should('not.be.visible');

    cy.contains('label.pf-v6-c-switch', 'Show labels').click();
    cy.get('.ocs-pf-topo-canvas-wrap--hide-labels').should('not.exist');
    cy.contains('svg text', 'br-ex').should('be.visible');

    cy.contains('label.pf-v6-c-switch', 'Hide management ports').click();
    expectNoSvgText('ovn-k8s-mp0');
    expectSvgText('ens5');

    cy.contains('label.pf-v6-c-switch', 'Compact view').click();
    cy.get('svg text').should(($texts) => {
      expect(workerNames($texts).length).to.be.greaterThan(5);
    });
    cy.contains('label.pf-v6-c-switch', 'Compact view').click();
    cy.contains('svg text', 'worker-0').should('be.visible');
    cy.get('svg text').should(($texts) => {
      expect(workerNames($texts)).to.not.include('worker-47');
    });

    cy.contains('label.pf-v6-c-radio__label', 'Tree').click();
    cy.contains('.pf-v6-c-radio', 'Tree').find('input').should('be.checked');
    cy.contains('svg text', 'worker-0').should('be.visible');
  });

  it('switches between the topology canvas and the table list', () => {
    cy.get('#node-network-view-topology').should('have.attr', 'aria-pressed', 'true');
    cy.get('.pf-topology-container').should('exist');

    cy.get('#node-network-view-table').click();
    cy.get('#node-network-view-table').should('have.attr', 'aria-pressed', 'true');
    cy.get('#node-network-view-topology').should('have.attr', 'aria-pressed', 'false');
    cy.get('.pf-topology-container').should('not.exist');
    cy.contains('th', 'Name').should('be.visible');
    cy.contains('th', 'Network interface').should('be.visible');
    cy.get('tbody tr').should('have.length.at.least', 1);
    cy.contains('tbody tr', 'interfaces').should('be.visible');

    cy.get('#node-network-view-topology').click();
    cy.get('#node-network-view-topology').should('have.attr', 'aria-pressed', 'true');
    cy.get('.pf-topology-container').should('exist');
    cy.contains('svg text', 'worker-0').should('be.visible');
  });
});
