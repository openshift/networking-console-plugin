import { visitAllNamespacesTopology } from '../../views/topology';

// https://redhat.atlassian.net/browse/OCPNETUI-231
describe.skip('OCPNETUI-138: Network topology resource details drawer', () => {
  beforeEach(() => {
    visitAllNamespacesTopology();
    // Open the first available topology node to show the drawer.
    cy.get('[data-id]', { timeout: 30000 }).first().click({ force: true });
  });

  it('opens the drawer with resource header and tab navigation', () => {
    cy.get('[data-test="topology-drawer"], .pf-topology-side-bar, [data-testid="drawer"]').should(
      'be.visible',
    );
    cy.contains('[role="tab"]', 'Details').should('be.visible');
    // TODO: assert full tab list and resource header from fixture data
  });

  it('shows Details tab fields for the selected resource', () => {
    cy.contains('[role="tab"]', 'Details').click();
    cy.log('TODO: assert Details fields for a known resource from fixtures');
  });

  it('shows Network path stack and path summary', () => {
    cy.contains('[role="tab"]', /network path/i).click();
    cy.log('TODO: assert path stack from fixture data');
  });

  it('shows Resources tab connections and mappings', () => {
    cy.contains('[role="tab"]', /resources/i).click();
    cy.log('TODO: assert connected interfaces / worker mapping from fixtures');
  });

  it('shows Observe tab health and metrics', () => {
    cy.contains('[role="tab"]', /observe/i).click();
    cy.log('TODO: assert metrics/health from fixture data');
  });

  it('lists resource actions in the Actions menu', () => {
    cy.get('[aria-label*="Actions"], button[aria-label^="Actions for"]').first().click();
    cy.contains('[role="menuitem"], .pf-v6-c-menu__item', 'View YAML').should('be.visible');
  });

  it('shows configuration alerts for a failed resource', () => {
    // TODO: seed a resource with a failed configuration policy and assert the alert
    cy.log('needs a failed-resource fixture');
  });

  it('closes the drawer from the inspector close button', () => {
    cy.get('button[aria-label*="Close"], button[aria-label="Close drawer"]').click();
    cy.get('[data-test="topology-drawer"], .pf-topology-side-bar').should('not.exist');
  });
});
