import { MINUTE, TEST_NS, TEST_POL_NAME } from '../../utils/const/base';
import { checkActionMenu, nameInput } from '../../views/actions';
import { brCrumbItem, egressOff, ingressOff, itemFilter, row } from '../../views/selector-common';

const denyTraffic = () => {
  cy.get(ingressOff).check();
  cy.get('body').then(($body) => {
    if ($body.find(egressOff).length) {
      cy.get(egressOff).check();
    }
  });
};

describe('Check NetworkPolicies page', () => {
  it('create NetworkPolicy with form', () => {
    cy.visit(`/k8s/ns/${TEST_NS}/networkpolicies`);
    cy.checkTitle('NetworkPolicies', MINUTE);
    cy.byButtonText('Create NetworkPolicy').click();
    cy.get('input#form').check();
    cy.get(nameInput, { timeout: 10000 }).should('be.visible').clear();
    cy.get(nameInput).type(TEST_POL_NAME);
    cy.get(nameInput).should('have.value', TEST_POL_NAME);
    denyTraffic();
    cy.clickBtn('Create');
    cy.checkTitle(TEST_POL_NAME);
    checkActionMenu('NetworkPolicy');
    cy.contains(brCrumbItem, 'NetworkPolicy').find('a').click();
    cy.get(itemFilter).type(TEST_POL_NAME);
    cy.contains(row, TEST_POL_NAME).should('exist');
  });
});
