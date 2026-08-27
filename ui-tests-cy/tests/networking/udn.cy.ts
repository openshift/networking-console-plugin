import { adminOnlyDescribe, MINUTE, UDN_NS } from '../../utils/const/base';
import { checkActionMenu } from '../../views/actions';
import { brCrumbItem } from '../../views/selector-common';
import { createUDN } from '../../views/udn';

const SUBNET = '192.168.1.1/24';
const UDN_CLST = 'cluster-udn';

adminOnlyDescribe('Test UDN', () => {
  it('create UDN', () => {
    createUDN(UDN_NS, SUBNET);
  });

  it('create CUDN', () => {
    cy.visit('/k8s/all-namespaces/k8s.ovn.org~v1~UserDefinedNetwork');
    cy.checkTitle('UserDefinedNetworks', MINUTE);
    cy.get(
      '[data-test="item-create"] .pf-v6-c-menu-toggle__controls, [data-test="item-create"] [aria-label="Menu toggle"]',
    ).click();
    cy.contains('ClusterUserDefinedNetwork').click();
    cy.byTestID('input-name', { timeout: 30000 }).should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.byTestID('input-name').clear();
    cy.byTestID('input-name').type(UDN_CLST);
    cy.byTestID('input-udn-subnet').clear();
    cy.byTestID('input-udn-subnet').type(SUBNET);
    cy.byTestID('tags-input').clear();
    cy.byTestID('tags-input').type(`kubernetes.io/metadata.name=${UDN_NS}`);
    cy.byButtonText('Review selected').click();
    cy.byTestID('create-udn-submit').click();
    cy.checkTitle(UDN_CLST);
    checkActionMenu('ClusterUserDefinedNetwork');
    cy.contains(brCrumbItem, 'ClusterUserDefinedNetworks').find('a').eq(0).click();
  });

  it('delete CUDN', () => {
    cy.visit('/k8s/all-namespaces/k8s.ovn.org~v1~UserDefinedNetwork');
    cy.checkTitle('UserDefinedNetworks', MINUTE);
    cy.contains('[data-label="name"]', UDN_CLST).find('a').click();
    cy.byButtonText('Actions').click();
    cy.get('[data-test-action="Delete ClusterUserDefinedNetwork"]').click();
    cy.byTestID('confirm-action').click();
    cy.contains(UDN_CLST).should('not.exist');
  });
});
