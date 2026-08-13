import Loggable = Cypress.Loggable;
import Timeoutable = Cypress.Timeoutable;
import Withinable = Cypress.Withinable;
import Shadow = Cypress.Shadow;

export const MINUTE = 60 * 1000;

export const resourceRow = '[data-test-rows="resource-row"]';
export const itemFilter = '[data-test-id="item-filter"]';

const assertOcSuccess = (
  result: {
    code: number;
    stderr: string;
    stdout: string;
  },
  message: string,
): void => {
  // On some macOS/Electron setups Cypress omits `code` even for successful commands.
  const code = result.code ?? 0;
  expect(code, `${message}: ${result.stderr || result.stdout}`).to.eq(0);
};

const healthAriaLabel = (
  status: 'Healthy' | 'Degraded' | 'Down' | 'Unknown',
  ready?: number,
  total?: number,
): string => {
  if (status === 'Unknown') {
    return 'Unknown: endpoint readiness not available';
  }
  return `${status}: ${ready} of ${total} endpoints ready`;
};

declare global {
  namespace Cypress {
    interface Chainable {
      byTestID(
        selector: string,
        options?: Partial<Loggable & Shadow & Timeoutable & Withinable>,
      ): Chainable;
      applyFixture(fixturePath: string, namespace: string): Chainable;
      deleteNamespace(namespace: string): Chainable;
      ensureNamespace(namespace: string): Chainable;
      filterByName(name: string): Chainable;
      getResourceRow(name: string): Chainable;
      assertEndpointHealth(
        name: string,
        status: 'Healthy' | 'Degraded' | 'Down' | 'Unknown',
        ready?: number,
        total?: number,
      ): Chainable;
    }
  }
}

Cypress.Commands.add(
  'byTestID',
  (selector: string, options?: Partial<Loggable & Shadow & Timeoutable & Withinable>) =>
    cy.get(`[data-test="${selector}"]`, options),
);

Cypress.Commands.add('ensureNamespace', (namespace: string) => {
  cy.exec(`oc create namespace ${namespace}`, { failOnNonZeroExit: false });
  cy.exec(`oc project ${namespace}`, { failOnNonZeroExit: false });
});

Cypress.Commands.add('deleteNamespace', (namespace: string) => {
  cy.exec(`oc delete namespace ${namespace} --ignore-not-found=true --wait=false`, {
    failOnNonZeroExit: false,
    timeout: 2 * MINUTE,
  });
});

Cypress.Commands.add('applyFixture', (fixturePath: string, namespace: string) => {
  cy.exec(`oc apply -n ${namespace} -f "${fixturePath}"`, {
    failOnNonZeroExit: false,
    timeout: 2 * MINUTE,
  }).then((result) => {
    cy.log(`oc apply stdout: ${result.stdout}`);
    cy.log(`oc apply stderr: ${result.stderr}`);
    assertOcSuccess(result, 'oc apply failed');
  });
});

Cypress.Commands.add('filterByName', (name: string) => {
  cy.get(itemFilter, { timeout: MINUTE }).should('be.visible').clear().type(name);
});

Cypress.Commands.add('getResourceRow', (name: string) =>
  cy.contains(resourceRow, name, { timeout: MINUTE }).should('exist'),
);

Cypress.Commands.add(
  'assertEndpointHealth',
  (
    name: string,
    status: 'Healthy' | 'Degraded' | 'Down' | 'Unknown',
    ready?: number,
    total?: number,
  ) => {
    const ariaLabel = healthAriaLabel(status, ready, total);

    cy.getResourceRow(name).within(() => {
      cy.get(`[aria-label="${ariaLabel}"]`, { timeout: MINUTE }).should('exist');

      if (status === 'Unknown') {
        cy.contains('Unknown').should('exist');
      } else if (ready !== undefined && total !== undefined) {
        cy.contains(`${ready}/${total}`).should('exist');
      }
    });
  },
);
