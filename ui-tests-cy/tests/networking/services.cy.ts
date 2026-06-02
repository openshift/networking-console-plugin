import { EXAMPLE, MINUTE, TEST_NS } from '../../utils/const/base';
import { checkActionMenu } from '../../views/actions';
import { createBtn } from '../../views/nad';
import { brCrumbItem, itemFilter, row } from '../../views/selector-common';

describe('Check Services page', () => {
  it('create Service with YAML', () => {
    cy.visit(`/k8s/ns/${TEST_NS}/services`);
    cy.checkTitle('Services', MINUTE);
    cy.byButtonText('Create Service').click();
    cy.get('.monaco-editor', { timeout: 30000 }).should('exist');
    cy.get(createBtn).click();
    cy.checkTitle(EXAMPLE);
    checkActionMenu('Service');
    cy.contains(brCrumbItem, 'Services').find('a').click();
    cy.get(itemFilter).type(EXAMPLE);
    cy.contains(row, EXAMPLE).should('exist');
  });
});
