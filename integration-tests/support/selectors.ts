// Cypress global augmentations require this file to be a module.
export {};

declare global {
  namespace Cypress {
    interface Chainable {
      byLegacyTestID(
        selector: string,
        options?: Partial<
          Cypress.Loggable & Cypress.Shadow & Cypress.Timeoutable & Cypress.Withinable
        >,
      ): Chainable<JQuery<HTMLElement>>;
      byOuiaId(
        id: string,
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

// PatternFly OUIA ids (ouiaId prop) render as data-ouia-component-id.
Cypress.Commands.add('byOuiaId', (id, options) => {
  cy.get(`[data-ouia-component-id="${id}"]`, options);
});

// Console SDK and legacy plugin selectors still use data-test / data-test-id.
Cypress.Commands.add('byTestID', (selector, options) => {
  cy.get(`[data-test="${selector}"]`, options);
});

Cypress.Commands.add('byLegacyTestID', (selector, options) => {
  cy.get(`[data-test-id="${selector}"]`, options);
});
