import { checkErrors } from '../support';
import { MINUTE } from '../support/commands';
import {
  assertPaginationVisible,
  assertVirtualMachinesTabHidden,
  assertVirtualMachinesTabSelected,
  assertVirtualMachinesTabVisible,
  assertVMDetailsPage,
  assertVMEmptyState,
  assertVMListed,
  assertVMListUnavailableWithoutKubevirt,
  assertVMNotListed,
  clickVMInTable,
  CUDN_NAME,
  CUDN_NS_A,
  CUDN_NS_B,
  filterVMsByName,
  isKubevirtInstalled,
  NAD_EMPTY,
  NAD_MULTI,
  NAD_NS,
  NAD_PAGED,
  NAD_WITH_VMS,
  UDN_EMPTY,
  UDN_NS,
  UDN_WITH_VM,
  visitCUDNVirtualMachinesTab,
  visitNADDetails,
  visitNADVirtualMachinesTab,
  visitUDNVirtualMachinesTab,
  waitForVmTableLoaded,
} from '../support/network-vm-navigation';

const BASE_FIXTURE = 'fixtures/network-vm-navigation-base.yaml';
const VM_FIXTURE = 'fixtures/network-vm-navigation-vms.yaml';

const TEST_NAMESPACES = [NAD_NS, UDN_NS, CUDN_NS_A, CUDN_NS_B];

describe('OCPNETUI-14: network-to-VM cross-navigation', { testIsolation: false }, () => {
  let kubevirtInstalled = false;

  before(() => {
    cy.login();
    isKubevirtInstalled().then((installed) => {
      kubevirtInstalled = installed;
      cy.applyFixtureFile(BASE_FIXTURE);
      if (installed) {
        cy.applyFixtureFile(VM_FIXTURE);
      }
    });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.exec(`oc delete clusteruserdefinednetwork ${CUDN_NAME} --ignore-not-found`, {
      failOnNonZeroExit: false,
      timeout: MINUTE,
    });
    cy.exec(
      `oc delete namespace ${TEST_NAMESPACES.join(' ')} --ignore-not-found --wait=false --request-timeout=30s`,
      { failOnNonZeroExit: false, timeout: MINUTE },
    );
    cy.logout();
  });

  it('connects to the OpenShift console', () => {
    cy.visit('/dashboards');
    cy.dismissWelcomeTourIfPresent();
    cy.get('[data-test="user-dropdown"], [data-test="user-dropdown-toggle"]', {
      timeout: MINUTE,
    }).should('exist');
  });

  context('UDN Virtual Machines tab', () => {
    it('shows the Virtual Machines tab on UDN details', () => {
      visitUDNVirtualMachinesTab(UDN_WITH_VM);
      assertVirtualMachinesTabSelected();
      assertVirtualMachinesTabVisible(kubevirtInstalled ? 1 : 0);
      cy.contains('button', 'Add virtual machines').should('be.visible');

      if (kubevirtInstalled) {
        assertVMListed('vm-udn-1');
      } else {
        assertVMListUnavailableWithoutKubevirt();
      }
    });

    it('shows an empty state when no VMs are attached', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitUDNVirtualMachinesTab(UDN_EMPTY);
      assertVirtualMachinesTabVisible(0);
      assertVMEmptyState();
    });

    it('navigates to the VM details page when a VM name is clicked', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitUDNVirtualMachinesTab(UDN_WITH_VM);
      clickVMInTable('vm-udn-1');
      assertVMDetailsPage('vm-udn-1', UDN_NS);
    });
  });

  context('CUDN Virtual Machines tab', () => {
    it('shows the Virtual Machines tab on CUDN details', () => {
      visitCUDNVirtualMachinesTab(CUDN_NAME);
      assertVirtualMachinesTabSelected();
      assertVirtualMachinesTabVisible(kubevirtInstalled ? 2 : 0);
      cy.contains('button', 'Add virtual machines').should('be.visible');

      if (!kubevirtInstalled) {
        assertVMListUnavailableWithoutKubevirt();
      }
    });

    it('lists VMs attached across member namespaces', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitCUDNVirtualMachinesTab(CUDN_NAME);
      waitForVmTableLoaded(2);
      assertVirtualMachinesTabVisible(2);
      assertVMListed('vm-cudn-a');
      assertVMListed('vm-cudn-b');
    });

    it('navigates to a VM in another namespace from the CUDN tab', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitCUDNVirtualMachinesTab(CUDN_NAME);
      waitForVmTableLoaded(1);
      clickVMInTable('vm-cudn-b');
      assertVMDetailsPage('vm-cudn-b', CUDN_NS_B);
    });
  });

  context('NAD Virtual Machines tab', () => {
    it('omits the Virtual Machines tab when KubeVirt is not installed', function () {
      if (kubevirtInstalled) {
        this.skip();
      }

      visitNADDetails(NAD_EMPTY);
      assertVirtualMachinesTabHidden();
    });

    it('shows the Virtual Machines tab when KubeVirt is installed', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitNADVirtualMachinesTab(NAD_WITH_VMS);
      assertVirtualMachinesTabVisible(1);
    });

    it('shows an empty state when no VMs use the NAD', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitNADVirtualMachinesTab(NAD_EMPTY);
      assertVirtualMachinesTabVisible(0);
      assertVMEmptyState();
    });

    it('lists a single attached VM and navigates to its details page', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitNADVirtualMachinesTab(NAD_WITH_VMS);
      assertVMListed('vm-nad-1');
      clickVMInTable('vm-nad-1');
      assertVMDetailsPage('vm-nad-1', NAD_NS);
    });

    it('lists multiple attached VMs on the same NAD', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitNADVirtualMachinesTab(NAD_MULTI);
      waitForVmTableLoaded(3);
      assertVirtualMachinesTabVisible(3);
      assertVMListed('vm-nad-a');
      assertVMListed('vm-nad-b');
      assertVMListed('vm-nad-c');
    });

    it('filters VMs by name in the table search', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitNADVirtualMachinesTab(NAD_MULTI);
      filterVMsByName('vm-nad-b');
      cy.get('table tbody tr:visible', { timeout: MINUTE }).should('have.length', 1);
      assertVMListed('vm-nad-b');
      assertVMNotListed('vm-nad-a');
      assertVMNotListed('vm-nad-c');
    });

    it('paginates when more than 20 VMs are attached', function () {
      if (!kubevirtInstalled) {
        this.skip();
      }

      visitNADVirtualMachinesTab(NAD_PAGED, '?perPage=20&page=1');
      waitForVmTableLoaded(20);
      assertVirtualMachinesTabVisible(21);
      assertPaginationVisible();
      cy.get('.pf-v6-c-pagination, .pf-c-pagination')
        .filter(':visible')
        .first()
        .should('contain.text', 'of 21');
      assertVMListed('vm-nad-page-01');
      assertVMNotListed('vm-nad-page-21');

      visitNADVirtualMachinesTab(NAD_PAGED, '?perPage=20&page=2');
      waitForVmTableLoaded(1);
      cy.get('.pf-v6-c-pagination, .pf-c-pagination')
        .filter(':visible')
        .first()
        .should('contain.text', '21')
        .and('contain.text', 'of 21');
      cy.get('table tbody tr', { timeout: MINUTE }).should('have.length', 1);
      assertVMNotListed('vm-nad-page-01');
    });
  });
});
