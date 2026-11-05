import { EXAMPLE, MINUTE, TEST_NS } from '../../utils/const/base';
import { checkActionMenu } from '../../views/actions';
import { createBtn } from '../../views/nad';
import { row } from '../../views/selector-common';

describe('Check Ingresses page', () => {
  it('create Ingress with YAML', () => {
    cy.visit(`/k8s/ns/${TEST_NS}/networking.k8s.io~v1~Ingress`);
    cy.checkTitle('Ingresses', MINUTE);
    // cy.byButtonText('Create Ingress').click();
    // cy.get('#yaml').check();
    // https://redhat.atlassian.net/browse/OCPNETUI-229
    cy.visit(`/k8s/ns/${TEST_NS}/networking.k8s.io~v1~Ingress/~new`);
    // Editor can mount before the YAML template loads; wait for actual content
    // or Create submits empty YAML ("No YAML content found").
    cy.get('.yaml-editor .view-line', { timeout: 30000 }).should('contain', 'kind');
    cy.get(createBtn).click();
    cy.checkTitle(EXAMPLE);
    checkActionMenu('Ingress');
    // The details-page breadcrumb links to the console's persisted last
    // namespace (stale on shared clusters), so go back to the list explicitly.
    // The list filter input is disabled while the list loads, which makes typing
    // racy; the name query filter is equivalent and deterministic.
    cy.visit(`/k8s/ns/${TEST_NS}/networking.k8s.io~v1~Ingress?name=${EXAMPLE}`);
    cy.checkTitle('Ingresses', MINUTE);
    cy.contains(row, EXAMPLE, { timeout: MINUTE }).should('exist');
  });
});
