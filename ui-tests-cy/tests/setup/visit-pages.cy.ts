import { MINUTE } from '../../utils/const/base';

describe('Visit networking pages', () => {
  it('visit NetworkAttachmentDefinitions page', () => {
    cy.get('[data-quickstart-id="qs-nav-networking"]', { timeout: MINUTE }).scrollIntoView();
    cy.contains('Networking').should('be.visible');
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
