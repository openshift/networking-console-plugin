import { MINUTE, SECOND } from '../utils/const/base';

declare global {
  namespace Cypress {
    interface Chainable {
      deleteResource(kind: string, name: string, namespace?: string): void;
      switchProject(projectName: string): void;
    }
  }
}

Cypress.Commands.add('deleteResource', (kind: string, name: string, namespace?: string) => {
  if (!namespace) {
    cy.exec(`oc delete --ignore-not-found=true ${kind} ${name} --wait=true --timeout=300s`, {
      failOnNonZeroExit: false,
      timeout: 5 * MINUTE,
    });
    return;
  }
  cy.exec(
    `oc delete --ignore-not-found=true -n ${namespace} ${kind} ${name} --wait=true --timeout=300s`,
    { failOnNonZeroExit: false, timeout: 5 * MINUTE },
  );
});

Cypress.Commands.add('switchProject', (projectName: string) => {
  cy.byLegacyTestID('namespace-bar-dropdown').contains('Project:').click();
  if (projectName === 'All Projects') {
    cy.contains('All Projects').click();
    return;
  }
  cy.get('body').then(($body) => {
    if ($body.find('[data-test="showSystemSwitch"]').length) {
      cy.byTestID('showSystemSwitch').check();
      cy.wait(3 * SECOND);
    }
  });
  cy.get(
    'input[data-test="dropdown-text-filter"], input[placeholder*="name"], input[aria-label*="filter"]',
    { timeout: 10000 },
  )
    .first()
    .clear()
    .type(projectName);
  cy.contains('[data-test="dropdown-menu-item-link"], [role="option"], button', projectName, {
    timeout: 10000,
  }).click();
});
