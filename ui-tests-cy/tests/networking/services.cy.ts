import { EXAMPLE, MINUTE, TEST_NS } from '../../utils/const/base';
import { checkActionMenu } from '../../views/actions';
import { createBtn } from '../../views/nad';
import { row } from '../../views/selector-common';

describe('Check Services page', () => {
  // https://redhat.atlassian.net/browse/OCPNETUI-230
  it('create Service with YAML', () => {
    cy.visit(`/k8s/ns/${TEST_NS}/services`);
    cy.checkTitle('Services', MINUTE);
    cy.byButtonText('Create Service').click();
    cy.get('#yaml').check();
    // Editor can mount before the YAML template loads; wait for actual content
    // or Create submits empty YAML ("No YAML content found").
    cy.get('.yaml-editor .view-line', { timeout: 30000 }).should('contain', 'kind');
    cy.get(createBtn).click();
    // Creating a Service does not reliably land on its details page (the heading
    // never becomes the resource name on CI), so verify through the list first
    // and only then open the details view. The list filter input is disabled
    // while the list loads, which makes typing racy; the name query filter is
    // equivalent and deterministic.
    cy.visit(`/k8s/ns/${TEST_NS}/services?name=${EXAMPLE}`);
    cy.checkTitle('Services', MINUTE);
    cy.contains(row, EXAMPLE, { timeout: MINUTE }).should('exist');
    cy.contains(row, EXAMPLE).find('a').first().click();
    cy.location('pathname', { timeout: MINUTE }).should('include', EXAMPLE);
    checkActionMenu('Service');
  });
});
