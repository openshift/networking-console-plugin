import {
  closePrototypeViewMenu,
  expectPrototypeSvgText,
  openPrototypeViewMenu,
  prototypeSvgText,
  prototypeViewToggle,
  visitPrototypeTopology,
} from '../../views/topology';

describe('OCPNETUI-136: Network topology node view', () => {
  beforeEach(() => {
    visitPrototypeTopology();
  });

  it('shows worker underlay nodes, status, and connections', () => {
    prototypeViewToggle().should('have.attr', 'aria-label', 'View: Node');
    openPrototypeViewMenu();
    cy.contains('[role="option"]', 'Node underlay').should('have.class', 'pf-m-selected');
    closePrototypeViewMenu();

    ['worker-0', 'worker-1', 'worker-2', 'worker-3', 'worker-4'].forEach((worker) => {
      cy.contains('.pf-topology__group__label', worker).should('be.visible');
    });
    cy.get('.ocs-pf-topo-node--kind-bridge').should('exist');
    cy.get('.ocs-pf-topo-node--kind-interface').should('exist');
    cy.get('.ocs-pf-topo-node--kind-tunnel').should('exist');
    cy.get('.ocs-pf-topo-node--kind-port').should('exist');
    expectPrototypeSvgText('br-ex');
    expectPrototypeSvgText('ens5');
    expectPrototypeSvgText('ovn-k8s-mp0');
    cy.get('.ocs-pf-topo-status--configured').should('exist');
    cy.get('.ocs-pf-topo-status--failed').should('exist');
    cy.get('.pf-topology__edge__link').should('have.length.at.least', 1);
    cy.get('.ocs-pf-topo-node--kind-bridge')
      .first()
      .should('contain.text', 'Kind: Bridge')
      .and('contain.text', 'Connected to');
  });

  it('restores the node underlay after switching views', () => {
    openPrototypeViewMenu();
    cy.contains('[role="option"]', 'Kubernetes namespace').click();
    prototypeViewToggle().should('have.attr', 'aria-label', 'View: Namespace');
    cy.get('svg text').should(($texts) => {
      const labels = prototypeSvgText($texts);
      expect(labels).to.not.include('worker-0');
      expect(labels).to.include('Logical networks');
    });

    openPrototypeViewMenu();
    cy.contains('[role="option"]', 'Node underlay').click();
    prototypeViewToggle().should('have.attr', 'aria-label', 'View: Node');
    expectPrototypeSvgText('worker-0');
    expectPrototypeSvgText('br-ex');
    cy.get('.ocs-pf-topo-node--kind-bridge').should('exist');
  });

  it('selects a bridge node on its worker', () => {
    cy.contains('.pf-topology__node__label', 'br-ex').click();
    cy.get('.pf-m-selected.ocs-pf-topo-node--kind-bridge').should('exist');
    cy.get('.ocs-pf-topo-sidebar')
      .should('be.visible')
      .and('contain.text', 'br-ex')
      .and('contain.text', 'worker-0');
  });

  it('removes a worker from the canvas and adds it back', () => {
    cy.get('.pf-topology-container').rightclick('topLeft');
    cy.contains('Add worker node').should('be.visible');
    cy.contains('Create network resource').should('be.visible');
    cy.contains('Add worker node').click();

    cy.contains('.pf-v6-c-modal-box', 'Manage worker nodes on topology').should('be.visible');
    cy.contains('.pf-v6-c-modal-box tbody tr', 'worker-0')
      .should('contain.text', 'Ready')
      .and('contain.text', 'On canvas');
    cy.contains('.pf-v6-c-modal-box tbody tr', 'worker-2').should('contain.text', 'Not ready');

    cy.get('button[aria-label="Remove worker-4 from topology"]').click();
    cy.contains('.pf-v6-c-modal-box', 'Removing worker-4').should('be.visible');
    cy.contains('button', 'Remove from topology').click();
    cy.contains('.pf-topology__group__label', 'worker-4').should('not.exist');
    cy.contains('.pf-topology__group__label', 'worker-0').should('be.visible');

    cy.get('.pf-topology-container').rightclick('topLeft');
    cy.contains('Add worker node').click();
    cy.contains('.pf-v6-c-modal-box tbody tr', 'worker-4').should('contain.text', 'Not added');
    cy.contains('.pf-v6-c-modal-box tbody tr', 'worker-4').find('input[type="checkbox"]').check();
    cy.get('button[aria-label="Add 1 worker node to topology"]').click();
    cy.contains('.pf-topology__group__label', 'worker-4').should('be.visible');
  });

  it('describes underlay resources in the legend', () => {
    cy.get('#legend').click();
    cy.get('.ocs-pf-topo-legend').should('be.visible');
    ['NIC', 'Bridge', 'Tunnel', 'Port'].forEach((resource) => {
      cy.get('.ocs-pf-topo-legend').should('contain.text', resource);
    });
    cy.get('.ocs-pf-topo-legend').should('contain.text', 'Click a node for details');
  });
});
