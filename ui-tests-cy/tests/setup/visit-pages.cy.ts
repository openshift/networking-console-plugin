import { MINUTE } from '../../utils/const/base';

describe('Visit networking pages', () => {
  before(() => {
    // Ensure console is loaded and nav is available
    cy.visit('/');
    cy.get('#page-sidebar', { timeout: 3 * MINUTE }).should('be.visible');
  });

  it('visit NetworkAttachmentDefinitions page', () => {
    cy.get('#page-sidebar', { timeout: MINUTE })
      .contains('Networking', { timeout: MINUTE })
      .should('be.visible');
    cy.clickNavLink(['Networking', 'NetworkAttachmentDefinitions']);
    cy.checkTitle('NetworkAttachmentDefinitions', MINUTE);
  });

  it('visit UserDefinedNetworks page', () => {
    cy.clickNavLink(['Networking', 'UserDefinedNetworks']);
    cy.checkTitle('UserDefinedNetworks', MINUTE);
  });

  it('visit Services page', () => {
    cy.clickNavLink(['Networking', 'Services']);
    cy.checkTitle('Services', MINUTE);
  });

  it('visit Routes page', () => {
    cy.clickNavLink(['Networking', 'Routes']);
    cy.checkTitle('Routes', MINUTE);
  });

  it('visit Ingresses page', () => {
    cy.clickNavLink(['Networking', 'Ingresses']);
    cy.checkTitle('Ingresses', MINUTE);
  });

  it('visit NetworkPolicies page', () => {
    cy.clickNavLink(['Networking', 'NetworkPolicies']);
    cy.checkTitle('NetworkPolicies', MINUTE);
  });
});
