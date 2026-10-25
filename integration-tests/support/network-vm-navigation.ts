import { MINUTE } from './commands';

export const NAD_NS = 'ocpnetui-14-nad';
export const UDN_NS = 'ocpnetui-14-udn';
export const CUDN_NS_A = 'ocpnetui-14-cudn-a';
export const CUDN_NS_B = 'ocpnetui-14-cudn-b';

export const NAD_EMPTY = 'nad-empty';
export const NAD_WITH_VMS = 'nad-with-vms';
export const NAD_MULTI = 'nad-multi';
export const NAD_PAGED = 'nad-paged';

export const UDN_EMPTY = 'test-udn-empty';
export const UDN_WITH_VM = 'test-udn';
export const CUDN_NAME = 'test-cudn';

const nadDetailsPath = (name: string, tab = ''): string =>
  `/k8s/ns/${NAD_NS}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition/${name}${tab ? `/${tab}` : ''}`;

const udnDetailsPath = (name: string, tab = ''): string =>
  `/k8s/ns/${UDN_NS}/k8s.ovn.org~v1~UserDefinedNetwork/${name}${tab ? `/${tab}` : ''}`;

const cudnDetailsPath = (name: string, tab = ''): string =>
  `/k8s/cluster/k8s.ovn.org~v1~ClusterUserDefinedNetwork/${name}${tab ? `/${tab}` : ''}`;

const vmDetailsPathPattern = (name: string, namespace: string): RegExp =>
  new RegExp(`/k8s/(cnv/)?ns/${namespace}/kubevirt\\.io~v1~VirtualMachine/${name}`);

const vmTableBody = 'table tbody';

const waitForVirtualMachinesTabReady = (): void => {
  cy.contains('button', 'Add virtual machines', { timeout: 2 * MINUTE }).should('be.visible');
  cy.get('body').then(($body) => {
    if ($body.text().includes('Sorry, we could not load')) {
      cy.reload();
      cy.dismissWelcomeTourIfPresent();
      cy.contains('button', 'Add virtual machines', { timeout: 2 * MINUTE }).should('be.visible');
    }
  });
};

export const waitForVmTableLoaded = (minRows = 1): void => {
  waitForVirtualMachinesTabReady();
  cy.contains('h4', 'Error loading virtual machines', { timeout: 2 * MINUTE }).should('not.exist');
  cy.get(vmTableBody, { timeout: 2 * MINUTE }).should('exist');
  if (minRows > 0) {
    cy.get(`${vmTableBody} tr`, { timeout: 2 * MINUTE }).should('have.length.at.least', minRows);
  }
};

export const visitNADVirtualMachinesTab = (nadName: string, query = ''): void => {
  cy.visit(`${nadDetailsPath(nadName, 'virtual-machines')}${query}`, {
    failOnStatusCode: false,
    timeout: 2 * MINUTE,
  });
  cy.dismissWelcomeTourIfPresent();
  waitForVirtualMachinesTabReady();
  assertVirtualMachinesTabSelected();
};

export const visitUDNVirtualMachinesTab = (udnName: string, query = ''): void => {
  cy.visit(`${udnDetailsPath(udnName, 'virtual-machines')}${query}`, {
    failOnStatusCode: false,
    timeout: 2 * MINUTE,
  });
  cy.dismissWelcomeTourIfPresent();
  waitForVirtualMachinesTabReady();
  assertVirtualMachinesTabSelected();
};

export const visitCUDNVirtualMachinesTab = (cudnName: string, query = ''): void => {
  cy.visit(`${cudnDetailsPath(cudnName, 'virtual-machines')}${query}`, {
    failOnStatusCode: false,
    timeout: 2 * MINUTE,
  });
  cy.dismissWelcomeTourIfPresent();
  waitForVirtualMachinesTabReady();
  assertVirtualMachinesTabSelected();
};

export const visitNADDetails = (nadName: string): void => {
  cy.visit(nadDetailsPath(nadName), { failOnStatusCode: false });
  cy.dismissWelcomeTourIfPresent();
};

export const assertVirtualMachinesTabSelected = (): void => {
  cy.contains('a[role="tab"], button[role="tab"]', 'Virtual Machines', { timeout: MINUTE }).should(
    'have.attr',
    'aria-selected',
    'true',
  );
};

export const assertVirtualMachinesTabVisible = (expectedCount?: number): void => {
  cy.contains('a[role="tab"], button[role="tab"]', 'Virtual Machines', { timeout: MINUTE }).should(
    'be.visible',
  );

  if (expectedCount !== undefined) {
    cy.contains('a[role="tab"], button[role="tab"]', 'Virtual Machines')
      .find('.pf-v6-c-badge, .pf-c-badge')
      .should('contain.text', String(expectedCount));
  }
};

export const assertVirtualMachinesTabHidden = (): void => {
  cy.get('body').then(($body) => {
    const tabs = $body.find('a[role="tab"], button[role="tab"]');
    const vmTab = tabs.filter((_, el) => el.textContent?.includes('Virtual Machines'));
    expect(vmTab.length, 'Virtual Machines tab should not be present').to.eq(0);
  });
};

export const assertVMEmptyState = (): void => {
  cy.contains('h4', 'No virtual machines found', { timeout: MINUTE }).should('be.visible');
  cy.contains('button', 'Add virtual machines').should('be.visible');
};

export const assertVMListUnavailableWithoutKubevirt = (): void => {
  cy.contains('h4', 'Error loading virtual machines', { timeout: MINUTE }).should('be.visible');
};

const vmNameLink = 'table a, [data-test="resource-link"]';

export const assertVMListed = (vmName: string): void => {
  cy.get(vmTableBody, { timeout: MINUTE }).contains(vmName).as('vmRow');
  cy.get('@vmRow').scrollIntoView();
  cy.get('@vmRow').should('be.visible');
};

export const assertVMNotListed = (vmName: string): void => {
  cy.get(`${vmTableBody} tr:visible`, { timeout: MINUTE }).should('not.contain', vmName);
};

export const clickVMInTable = (vmName: string): void => {
  cy.contains(vmNameLink, vmName, { timeout: MINUTE }).first().as('vmLink');
  cy.get('@vmLink').scrollIntoView();
  cy.get('@vmLink').click();
};

export const assertVMDetailsPage = (vmName: string, namespace: string): void => {
  cy.url({ timeout: 2 * MINUTE }).should('match', vmDetailsPathPattern(vmName, namespace));
  cy.dismissWelcomeTourIfPresent();
  cy.contains('[data-test="page-heading"], h1', vmName, { timeout: 2 * MINUTE }).should(
    'be.visible',
  );
};

export const filterVMsByName = (name: string): void => {
  waitForVmTableLoaded(1);

  cy.get('input[placeholder="Search by name..."]').filter(':visible').first().as('vmNameFilter');

  cy.get('@vmNameFilter').focus();
  cy.get('@vmNameFilter').clear({ force: true });
  cy.get('@vmNameFilter').type(name, { delay: 50, force: true });
  cy.get('@vmNameFilter').type('{enter}', { force: true });

  cy.get(vmTableBody, { timeout: MINUTE }).should('contain', name);
  assertVMListed(name);
};

export const assertPaginationVisible = (): void => {
  cy.get('.pf-v6-c-pagination, .pf-c-pagination', { timeout: MINUTE })
    .filter(':visible')
    .first()
    .should('be.visible');
};

export const goToNextPaginationPage = (): void => {
  cy.get('button[aria-label="Go to next page"], button[aria-label^="Go to next page"]', {
    timeout: MINUTE,
  })
    .filter(':visible')
    .first()
    .should('not.be.disabled')
    .click();

  // PatternFly pagination updates URL search params asynchronously.
  cy.url({ timeout: MINUTE }).should('match', /page=2/);
};

export const isKubevirtInstalled = (): Cypress.Chainable<boolean> =>
  cy
    .exec('oc api-resources --api-group=kubevirt.io -o name', { failOnNonZeroExit: false })
    .then((result) => (result.stdout || '').includes('virtualmachines.kubevirt.io'));
