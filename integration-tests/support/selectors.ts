declare global {
  namespace Cypress {
    interface Chainable {
      byLegacyTestID(
        selector: string,
        options?: Partial<
          Cypress.Loggable & Cypress.Shadow & Cypress.Timeoutable & Cypress.Withinable
        >,
      ): Chainable<JQuery<HTMLElement>>;
      byTestID(
        selector: string,
        options?: Partial<
          Cypress.Loggable & Cypress.Shadow & Cypress.Timeoutable & Cypress.Withinable
        >,
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('byTestID', (selector, options) => {
  cy.get(`[data-test="${selector}"]`, options);
});

Cypress.Commands.add('byLegacyTestID', (selector, options) => {
  cy.get(`[data-test-id="${selector}"]`, options);
});
