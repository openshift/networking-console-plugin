import { ALL_PROJ_NS, MINUTE } from '../utils/const/base';

import { checkActionMenu } from './actions';
import { brCrumbItem, row } from './selector-common';

export const UDN_PRIM_UDN_NS = 'primary-udn';

export const createUDN = (project: string, subnet: string) => {
  cy.visitUDN();
  cy.byButtonText('Create').click();
  const CREATE_ITEM = '[data-test="list-page-create-dropdown-item-UserDefinedNetwork"]';
  // Clicking Create opens either the form directly or a create-type dropdown,
  // and the dropdown mounts a tick later. Wait for one of the two before
  // deciding, otherwise the dropdown is missed and no form ever opens.
  cy.get('body', { timeout: MINUTE }).should(($body) => {
    const formOpen = $body
      .find('h1')
      .filter((_index, el) => (el.textContent || '').includes('Create UserDefinedNetwork')).length;
    expect(formOpen || $body.find(CREATE_ITEM).length, 'create form or create dropdown').to.be.ok;
  });
  cy.get('body').then(($body) => {
    if ($body.find(CREATE_ITEM).length) {
      cy.get(CREATE_ITEM).find('button').click();
    }
  });
  cy.checkTitle('Create UserDefinedNetwork', MINUTE);
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
