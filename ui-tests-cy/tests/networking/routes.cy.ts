import { EXAMPLE, MINUTE, TEST_NS, TEST_ROUTE_NAME } from '../../utils/const/base';
import { checkActionMenu, nameInput } from '../../views/actions';
import { createBtn } from '../../views/nad';
import { row } from '../../views/selector-common';

describe('Check Routes page', () => {
  it('create Route with form', () => {
    cy.exec(
      `oc get service ${EXAMPLE} -n ${TEST_NS} 2>/dev/null || oc create service clusterip ${EXAMPLE} --tcp=80:80 -n ${TEST_NS}`,
      { failOnNonZeroExit: false },
    );
    cy.visit(`/k8s/ns/${TEST_NS}/routes`);
    cy.checkTitle('Routes', MINUTE);
    cy.byButtonText('Create Route').click();
    cy.get('input#form').check();
    cy.get(nameInput).clear();
    cy.get(nameInput).type(TEST_ROUTE_NAME);
    cy.byButtonText('Select a Service').click();
    cy.byButtonText(EXAMPLE).click();
    cy.byButtonText('Select target port').click();
    cy.get('#target-port').within(() => {
      cy.get('button').click();
    });
    cy.get(createBtn).click();
    cy.checkTitle(TEST_ROUTE_NAME);
    checkActionMenu('Route');
    // The details-page breadcrumb links to the console's persisted last
    // namespace (stale on shared clusters), so go back to the list explicitly.
    // The list filter input is disabled while the list loads, which makes typing
    // racy; the name query filter is equivalent and deterministic.
    cy.visit(`/k8s/ns/${TEST_NS}/routes?name=${TEST_ROUTE_NAME}`);
    cy.checkTitle('Routes', MINUTE);
    cy.contains(row, TEST_ROUTE_NAME, { timeout: MINUTE }).should('exist');
  });
});
