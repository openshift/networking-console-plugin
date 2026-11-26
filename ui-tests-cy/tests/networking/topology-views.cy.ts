import { visitAllNamespacesTopology, waitForTopologyPageReady } from '../../views/topology';

// View:*** menu is not added yet
describe.skip('OCPNETUI-139: Network topology additional views', () => {
  beforeEach(() => {
    visitAllNamespacesTopology();
  });

  it('lists Owner, Namespace, Network, and Resource in the view menu', () => {
    // Cluster view selector — adapt label to the deployed control.
    cy.get('[data-test*="view"], button[aria-label*="View"]').first().click();
    ['Owner', 'Namespace', 'Network', 'Resource'].forEach((view) => {
      cy.contains('[role="option"]', view).should('be.visible');
    });
    cy.get('body').type('{esc}');
  });

  it('shows Owner view grouped by Deployment and VirtualMachine owners', () => {
    cy.get('[data-test*="view"], button[aria-label*="View"]').first().click();
    cy.contains('[role="option"]', 'Owner').click();
    waitForTopologyPageReady();
    // TODO: assert Owner grouping from fixture data
  });

  it('shows Namespace view grouped by Kubernetes namespace', () => {
    cy.get('[data-test*="view"], button[aria-label*="View"]').first().click();
    cy.contains('[role="option"]', 'Namespace').click();
    waitForTopologyPageReady();
  });

  it('shows Network view with logical networks and cluster fabric', () => {
    cy.get('[data-test*="view"], button[aria-label*="View"]').first().click();
    cy.contains('[role="option"]', 'Network').click();
    waitForTopologyPageReady();
  });

  it('shows Resource view with individual attachments and underlay resources', () => {
    cy.get('[data-test*="view"], button[aria-label*="View"]').first().click();
    cy.contains('[role="option"]', 'Resource').click();
    waitForTopologyPageReady();
  });

  it('switches between Owner, Namespace, Network, and Resource views', () => {
    const views = ['Owner', 'Namespace', 'Network', 'Resource'];
    for (const view of views) {
      cy.get('[data-test*="view"], button[aria-label*="View"]').first().click();
      cy.contains('[role="option"]', view).click();
      waitForTopologyPageReady();
    }
    // Back to default
    cy.get('[data-test*="view"], button[aria-label*="View"]').first().click();
    cy.contains('[role="option"]', 'Node').click();
    waitForTopologyPageReady();
  });
});
