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
    // Click the dropdown item's own button: its label is a text node that can
    // be covered by list rows, which makes a plain text click fail actionability.
    const CUDN_CREATE_ITEM =
      '[data-test="list-page-create-dropdown-item-ClusterUserDefinedNetwork"]';
    cy.get('body', { timeout: MINUTE }).should(($body) => {
      const formOpen = $body.find('[data-testid="input-name"], #input-name').length;
      expect(formOpen || $body.find(CUDN_CREATE_ITEM).length, 'create form or dropdown').to.be.ok;
    });
    cy.get('body').then(($body) => {
      if ($body.find(CUDN_CREATE_ITEM).length) {
        cy.get(`${CUDN_CREATE_ITEM} button`).click();
      }
    });
    cy.byTestID('input-name', { timeout: MINUTE }).should('be.visible');
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
    cy.contains(brCrumbItem, 'UserDefinedNetworks').find('a').eq(0).click();
  });

  it('delete CUDN', () => {
    cy.visit('/k8s/all-namespaces/k8s.ovn.org~v1~UserDefinedNetwork');
    cy.checkTitle('UserDefinedNetworks', MINUTE);
    cy.contains('[data-label="name"]', UDN_CLST).find('a').click();
    cy.byButtonText('Actions').click();
    cy.contains('button', 'Delete ClusterUserDefinedNetwork').click();
    cy.byTestID('confirm-action').click();
    cy.contains(UDN_CLST).should('not.exist');
  });
});
