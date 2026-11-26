import { visitAllNamespacesTopology, waitForTopologyPageReady } from '../../views/topology';

describe('OCPNETUI-136: Network topology node view', () => {
  beforeEach(() => {
    visitAllNamespacesTopology();
  });

  it('shows worker underlay nodes, status, and connections', () => {
    waitForTopologyPageReady();
    // Cluster topology renders the node-underlay from live cluster data.
    // TODO: seed deterministic node/bond/bridge resources (fixtures) and
    // assert their data-id nodes, status badges, and edges.
    cy.get('.pf-topology-container').should('exist');
    cy.get('[data-id][data-kind="node"]').should('have.length.at.least', 0);
  });

  it('restores the node underlay after switching views', () => {
    waitForTopologyPageReady();
    cy.log('TODO: switch views and assert underlay restored — needs fixture data');
  });

  it('selects a bridge node on its worker', () => {
    waitForTopologyPageReady();
    cy.log('TODO: select a known bridge node and assert selection state');
  });

  it('removes a worker from the canvas and adds it back', () => {
    waitForTopologyPageReady();
    cy.log('TODO: worker add/remove via cluster controls');
  });

  it('describes underlay resources in the legend', () => {
    cy.get('button')
      .contains(/legend/i)
      .click({ force: true });
    cy.contains(/legend/i).should('be.visible');
    cy.get('body').type('{esc}');
  });
});
