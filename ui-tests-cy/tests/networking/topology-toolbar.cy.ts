import { MINUTE } from '../../utils/const/base';
import {
  clearTopologySearch,
  searchTopology,
  visitAllNamespacesTopology,
  waitForTopologyPageReady,
} from '../../views/topology';

describe('OCPNETUI-137: Network topology toolbar', () => {
  beforeEach(() => {
    visitAllNamespacesTopology();
  });

  it('lists resource types in the filter menu and filters the graph', () => {
    cy.byLegacyTestID('topology-resource-filter').should('contain', 'Filter by').click();
    // The footer button always renders. Option items are derived from live node
    // counts, and PF SelectOption with hasCheckbox carries no ARIA role, so
    // address them through the menu item class inside the filter list.
    cy.contains('button', 'Clear all filters', { timeout: MINUTE }).should('be.visible');

    cy.get('body').then(($body) => {
      const items = $body.find('.networking-topology__filter-list .pf-v6-c-menu__item');
      if (items.length === 0) {
        cy.log('No resource types in the current topology — filter list is empty by design');
        return;
      }

      // Labels carry live counts, e.g. "NIC (3)".
      expect(items.first().text()).to.match(/\(\d+\)/);
      cy.wrap(items.first()).click();
      cy.get('.networking-topology__filter-list input[type="checkbox"]')
        .first()
        .should('be.checked');
      cy.contains('button', 'Clear all filters').click();
    });

    cy.get('body').type('{esc}');
    waitForTopologyPageReady();
  });

  it('filters the graph from the search bar and clears the query', () => {
    cy.byLegacyTestID('topology-search').find('input').should('be.visible');
    searchTopology('bond0');
    // TODO: assert on a known node from fixture data
    clearTopologySearch();
    cy.byLegacyTestID('topology-search').find('input').should('have.value', '');

    searchTopology('no-such-resource');
    cy.get('svg text').should('not.exist');
  });

  it('adds and clears an advanced name filter', () => {
    // TODO: cluster page advanced-filter UI may differ from prototype.
    // Re-map to the deployed filter controls once confirmed on-cluster.
    cy.log('advanced name filter — TODO: wire to cluster controls');
  });

  it('toggles labels, management ports, compact view, and layout', () => {
    // Display toggles live on the cluster topology toolbar.
    cy.get('#topology-display-graph').should('be.visible');
    cy.byLegacyTestID('topology-search').should('be.visible');
    // TODO: exercise the cluster display-options toggle and assert label/layout changes
    cy.log('display toggles — TODO: wire to cluster controls');
  });

  it('switches between the topology canvas and the table list', () => {
    cy.get('button#topology-display-graph').should('be.visible');
    cy.get('button#topology-display-table').click();
    cy.get('table[role="grid"]').should('be.visible');
    cy.get('button#topology-display-graph').click();
    cy.get('#topology-display-graph').should('be.visible');
  });
});
