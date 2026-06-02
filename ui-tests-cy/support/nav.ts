import { MINUTE } from '../utils/const/base';

declare global {
  namespace Cypress {
    interface Chainable {
      visitNAD(): void;
      visitService(): void;
      visitUDN(): void;
    }
  }
}

Cypress.Commands.add('visitNAD', () => {
  const ns = Cypress.env('TEST_NS') || 'cy-test-ns';
  cy.visit(`/k8s/ns/${ns}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition`);
  cy.checkTitle('NetworkAttachmentDefinitions', MINUTE);
});

Cypress.Commands.add('visitUDN', () => {
  cy.visit('/k8s/all-namespaces/k8s.ovn.org~v1~UserDefinedNetwork');
  cy.checkTitle('UserDefinedNetworks', MINUTE);
  cy.byButtonText('Create').should('be.visible');
});

Cypress.Commands.add('visitService', () => {
  cy.visit('/k8s/all-namespaces/services');
  cy.checkTitle('Services', MINUTE);
});
