import {
  CUDN_NS,
  EMPTY_NS,
  LOCALNET_NS,
  MINUTE,
  NAD_NS,
  SECOND,
  TEST_NS,
  TOPO_NS,
  UDN_NS,
} from '../utils/const/base';

declare global {
  namespace Cypress {
    interface Chainable {
      applyFixtureFile(fixturePath: string): void;
      deleteResource(kind: string, name: string, namespace?: string): void;
      switchProject(projectName: string): void;
    }
  }
}

const FIXTURE_PLACEHOLDERS: Record<string, string> = {
  CUDN_NS,
  EMPTY_NS,
  LOCALNET_NS,
  NAD_NS,
  TEST_NS,
  TOPO_NS,
  UDN_NS,
};

Cypress.Commands.add('applyFixtureFile', (fixturePath: string) => {
  const absolutePath = `${Cypress.config('projectRoot')}/${fixturePath}`;
  cy.readFile(absolutePath, 'utf8').then((contents: string) => {
    const rendered = Object.entries(FIXTURE_PLACEHOLDERS).reduce(
      (text, [key, value]) => text.split(`\${${key}}`).join(value),
      contents,
    );
    const tempPath = `/tmp/networking-console-plugin-fixture-${Date.now()}.yaml`;
    cy.writeFile(tempPath, rendered, 'utf8');
    cy.exec(`oc apply -f "${tempPath}"`, {
      failOnNonZeroExit: false,
      timeout: 5 * MINUTE,
    }).then(({ exitCode, stderr }) => {
      expect(exitCode, `oc apply failed: ${stderr}`).to.eq(0);
    });
  });
});

Cypress.Commands.add('deleteResource', (kind: string, name: string, namespace?: string) => {
  const args = ['oc', 'delete', '--ignore-not-found=true'];
  if (namespace) {
    args.push('-n', namespace);
  }
  args.push(kind, name, '--wait=true', '--timeout=300s');
  cy.exec(args.join(' '), { failOnNonZeroExit: false, timeout: 5 * MINUTE });
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
    .then(($input) => {
      cy.wrap($input).clear();
      cy.wrap($input).type(projectName);
    });
  cy.contains('[data-test="dropdown-menu-item-link"], [role="option"], button', projectName, {
    timeout: 10000,
  }).click();
});
