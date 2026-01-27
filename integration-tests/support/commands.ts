declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select an element by data-test-id attribute
       * @param testId - The value of the data-test-id attribute
       * @param options - Optional Cypress command options (timeout, etc.)
       * @example cy.getByTestId('resource-summary')
       * @example cy.getByTestId('resource-summary', { timeout: 10000 })
       */
      getByTestId(testId: string, options?: Partial<Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to select an element by data-test attribute
       * @param testId - The value of the data-test attribute
       * @param options - Optional Cypress command options (timeout, etc.)
       * @example cy.getByTest('breadcrumb-link')
       */
      getByTest(testId: string, options?: Partial<Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>): Chainable<JQuery<HTMLElement>>;
    }
  }
}

/**
 * Custom command to get element by data-test-id attribute
 * Usage: cy.getByTestId('resource-summary')
 */
Cypress.Commands.add('getByTestId', (testId: string, options?: Partial<Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) => {
  return cy.get(`[data-test-id="${testId}"]`, options);
});

/**
 * Custom command to get element by data-test attribute
 * Usage: cy.getByTest('breadcrumb-link')
 */
Cypress.Commands.add('getByTest', (testId: string, options?: Partial<Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) => {
  return cy.get(`[data-test="${testId}"]`, options);
});

export {};
