import { EXAMPLE, MINUTE, TEST_NS } from '../../utils/const/base';
import { checkActionMenu } from '../../views/actions';
import { createBtn } from '../../views/nad';
import { brCrumbItem, itemFilter, row } from '../../views/selector-common';

describe('Check Ingresses page', () => {
  it('create Ingress with YAML', () => {
    cy.visit(`/k8s/ns/${TEST_NS}/ingresses`);
    cy.checkTitle('Ingresses', MINUTE);
    cy.byButtonText('Create Ingress').click();
    cy.get('.monaco-editor', { timeout: 30000 }).should('exist');
    cy.get(createBtn).click();
    cy.checkTitle(EXAMPLE);
    checkActionMenu('Ingress');
    cy.contains(brCrumbItem, 'Ingresses').find('a').click();
    cy.get(itemFilter).clear();
    cy.get(itemFilter).type(EXAMPLE);
    cy.contains(row, EXAMPLE).should('exist');
  });
});
