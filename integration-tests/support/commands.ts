import Loggable = Cypress.Loggable;
import Shadow = Cypress.Shadow;
import Timeoutable = Cypress.Timeoutable;
import Withinable = Cypress.Withinable;

export const MINUTE = 60 * 1000;

export const itemFilter = '[data-test-id="item-filter"]';
export const resourceRow = '[data-test-rows="resource-row"]';

type EndpointHealthStatus = 'Degraded' | 'Down' | 'Healthy' | 'Unknown';

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
  expect(code, message).to.eq(0);
};

const healthAriaLabel = (status: EndpointHealthStatus, ready?: number, total?: number): string => {
  if (status === 'Unknown') {
    return 'Unknown: endpoint readiness not available';
  }
  return `${status}: ${ready} of ${total} endpoints ready`;
};

declare global {
  namespace Cypress {
    interface Chainable {
      applyFixture(fixturePath: string, namespace: string): Chainable;
      assertEndpointHealth(
        name: string,
        status: EndpointHealthStatus,
        ready?: number,
        total?: number,
      ): Chainable;
      byTestID(
        selector: string,
        options?: Partial<Loggable & Shadow & Timeoutable & Withinable>,
      ): Chainable;
      deleteNamespace(namespace: string): Chainable;
      ensureNamespace(namespace: string): Chainable;
      filterByName(name: string): Chainable;
      getResourceRow(name: string): Chainable;
    }
  }
}

Cypress.Commands.add(
  'byTestID',
  (selector: string, options?: Partial<Loggable & Shadow & Timeoutable & Withinable>) =>
    cy.get(`[data-test="${selector}"]`, options),
);

Cypress.Commands.add('ensureNamespace', (namespace: string) => {
  cy.exec(`oc create namespace ${namespace}`, { failOnNonZeroExit: false }).then((result) => {
    const code = result.code ?? 0;
    const alreadyExists = /AlreadyExists/i.test(`${result.stderr || ''}${result.stdout || ''}`);
    if (code !== 0 && !alreadyExists) {
      expect(code, 'failed to create namespace').to.eq(0);
    }
  });
  cy.exec(`oc project ${namespace}`, { failOnNonZeroExit: false }).then((result) => {
    assertOcSuccess(result, 'failed to select namespace');
  });
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
    assertOcSuccess(result, 'oc apply failed');
  });
});

Cypress.Commands.add('filterByName', (name: string) => {
  cy.get(itemFilter, { timeout: MINUTE }).should('be.visible').clear();
  cy.get(itemFilter, { timeout: MINUTE }).type(`${name}{enter}`);
  cy.contains(resourceRow, name, { timeout: MINUTE }).should('exist');
});

Cypress.Commands.add('getResourceRow', (name: string) =>
  cy.contains(resourceRow, name, { timeout: MINUTE }).should('exist'),
);

Cypress.Commands.add(
  'assertEndpointHealth',
  (name: string, status: EndpointHealthStatus, ready?: number, total?: number) => {
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
