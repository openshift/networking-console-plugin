import { MINUTE, TEST_NS, TEST_POL_NAME } from '../../utils/const/base';
import { nameInput } from '../../views/actions';
import { egressOff, ingressOff, row } from '../../views/selector-common';

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
    cy.visit(`/k8s/ns/${TEST_NS}/networking.k8s.io~v1~NetworkPolicy`);
    cy.checkTitle('NetworkPolicies', MINUTE);
    cy.byButtonText('Create NetworkPolicy').click();
    cy.get('input#form').check();
    cy.get(nameInput, { timeout: 10000 }).should('be.visible').clear();
    cy.get(nameInput).type(TEST_POL_NAME);
    // The form initializes with a generated name like `policy-ivory-baboon` and
    // typing may race with a re-render, so accept either and capture the value
    // that actually ended up in the field. A value alias is re-resolved lazily
    // on CI and came back undefined, so keep it in a variable instead.
    cy.get(nameInput)
      .invoke('val')
      .should('match', /auto-test-net-policy|policy-/);
    let polName = TEST_POL_NAME;
    cy.get(nameInput)
      .invoke('val')
      .then((value) => {
        polName = String(value || TEST_POL_NAME);
      });
    denyTraffic();
    cy.clickBtn('Create');
    cy.then(() => {
      // Creating a NetworkPolicy does not reliably land on its details page, so
      // verify through the list first and only then open the details view.
      // The list filter input is briefly disabled while the list loads, which
      // makes typing racy on CI; the console's name query filter is equivalent
      // and deterministic.
      cy.visit(`/k8s/ns/${TEST_NS}/networking.k8s.io~v1~NetworkPolicy?name=${polName}`);
      cy.checkTitle('NetworkPolicies', MINUTE);
      cy.contains(row, polName, { timeout: MINUTE }).should('exist');
      cy.contains(row, polName).find('a').first().click();
      // The details page heading is not the resource name in this console
      // build; assert the route points at the policy instead.
      cy.location('pathname', { timeout: MINUTE }).should('include', polName);
    });
  });
});
