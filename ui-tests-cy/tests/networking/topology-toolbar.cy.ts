import {
  expectPrototypeSvgText,
  expectPrototypeSvgTextAbsent,
  openPrototypeDisplayOptions,
  prototypeAdvancedFiltersButton,
  prototypeFilterToggle,
  prototypeSearchInput,
  prototypeWorkerNames,
  visitPrototypeTopology,
} from '../../views/topology';

describe('OCPNETUI-137: Network topology toolbar', () => {
  beforeEach(() => {
    visitPrototypeTopology();
  });

  it('lists resource types in the filter menu and filters the graph', () => {
    prototypeFilterToggle().should('contain', 'Filter by...').click();
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
    prototypeFilterToggle().should('have.attr', 'aria-label', 'Filter: NIC');
    expectPrototypeSvgText('ens5');
    expectPrototypeSvgTextAbsent('br-ex');

    prototypeFilterToggle().click();
    cy.contains('[role="option"]', 'All types').click();
    prototypeFilterToggle().should('contain', 'Filter by...');
    cy.contains('svg text', 'br-ex').should('be.visible');
  });

  it('filters the graph from the search bar and clears the query', () => {
    prototypeSearchInput().should('have.attr', 'placeholder', 'Search topology...');
    prototypeSearchInput().type('bond0');
    expectPrototypeSvgText('bond0');
    expectPrototypeSvgTextAbsent('br-ex');

    cy.get('.pf-v6-c-text-input-group button[aria-label="Reset"]').click();
    prototypeSearchInput().should('have.value', '');
    cy.contains('svg text', 'br-ex').should('be.visible');

    prototypeSearchInput().type('no-such-resource');
    cy.get('svg text').should('not.exist');
  });

  it('adds and clears an advanced name filter', () => {
    prototypeAdvancedFiltersButton().click();
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
    expectPrototypeSvgText('br-int');
    expectPrototypeSvgTextAbsent('br-ex');

    cy.contains('button', 'Clear filters').click();
    cy.contains('.pf-v6-c-label', 'Name contains "br-int"').should('not.exist');
    expectPrototypeSvgText('br-ex');
  });

  it('toggles labels, management ports, compact view, and layout', () => {
    openPrototypeDisplayOptions();
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
    expectPrototypeSvgTextAbsent('ovn-k8s-mp0');
    expectPrototypeSvgText('ens5');

    cy.contains('label.pf-v6-c-switch', 'Compact view').click();
    cy.get('svg text').should(($texts) => {
      expect(prototypeWorkerNames($texts).length).to.be.greaterThan(5);
    });
    cy.contains('label.pf-v6-c-switch', 'Compact view').click();
    cy.contains('svg text', 'worker-0').should('be.visible');
    cy.get('svg text').should(($texts) => {
      expect(prototypeWorkerNames($texts)).to.not.include('worker-47');
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
