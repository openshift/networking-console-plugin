import { ALL_PROJ_NS } from '../utils/const/base';

import { checkActionMenu } from './actions';
import { row } from './selector-common';
import { brCrumbItem } from './selector-common';

export const UDN_PRIM_UDN_NS = 'primary-udn';

export const createUDN = (project: string, subnet: string) => {
  cy.visitUDN();
  cy.byButtonText('Create').click();
  cy.get('body').then(($body) => {
    if ($body.find('[data-test="list-page-create-dropdown-item-UserDefinedNetwork"]').length) {
      cy.get('[data-test="list-page-create-dropdown-item-UserDefinedNetwork"]')
        .find('button')
        .click();
    }
  });
  cy.checkTitle('Create UserDefinedNetwork');
  cy.get('#typeahead-select-input').find('input').type(project);
  cy.get(`#select-typeahead-${project}`, { timeout: 10000 }).click();
  cy.byTestID('input-udn-subnet').clear();
  cy.byTestID('input-udn-subnet').type(subnet);
  cy.byTestID('create-udn-submit').should('not.be.disabled').click();
  cy.checkTitle(UDN_PRIM_UDN_NS);
  checkActionMenu('UserDefinedNetwork');
  cy.contains(brCrumbItem, 'UserDefinedNetworks').find('a').eq(0).click();
  cy.contains(row, UDN_PRIM_UDN_NS).should('exist');
};

export const deleteUDN = () => {
  cy.visitUDN();
  cy.switchProject(ALL_PROJ_NS);
  cy.contains('[data-label="name"]', UDN_PRIM_UDN_NS).find('a').click();
  cy.byButtonText('Actions').click();
  cy.get('[data-test-action="Delete UserDefinedNetwork"]').click();
  cy.byTestID('confirm-action').click();
  cy.contains(UDN_PRIM_UDN_NS).should('not.exist');
};
