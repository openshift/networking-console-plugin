export const nameInput = 'input#name';

export const getRow = (name: string, within: VoidFunction) =>
  cy.byTestRows('resource-row').contains(name).parents('tr').within(within);

export const checkActionMenu = (item: string) => {
  cy.byButtonText('Actions').should('exist').click();
  // PF Dropdown items expose stable data-test-id (e.g. edit-labels-ingresses) with OUIA fallback.
  // Use prefix selector to cover both namespaced new ids and legacy generic ids.
  cy.get('[data-test-id^="edit-labels"], [data-test-id="edit-labels"]', { timeout: 10000 }).should(
    'exist',
  );
  cy.get('[data-test-id^="edit-annotations"], [data-test-id="edit-annotations"]', {
    timeout: 10000,
  }).should('exist');
  // Text guards ensure the deployed UI actually renders the expected labels (not just an id).
  cy.contains('Edit labels').should('exist');
  cy.contains('Edit annotations').should('exist');
  // Edit/Delete for the specific kind: prefer data-test-id, fallback to text (covers singular/plural id variants)
  const lower = item.toLowerCase();
  cy.get('body').then(($body) => {
    const editSel = `[data-test-id="edit-${lower}"], [data-test-id="edit-${lower}s"], [data-test-id^="edit-${lower}"]`;
    if ($body.find(editSel).length) {
      cy.get(editSel).should('exist');
    } else {
      cy.contains(`Edit ${item}`).should('exist');
    }
    const delSel = `[data-test-id="delete-${lower}"], [data-test-id="delete-${lower}s"], [data-test-id^="delete-${lower}"]`;
    if ($body.find(delSel).length) {
      cy.get(delSel).should('exist');
    } else {
      cy.contains(`Delete ${item}`).should('exist');
    }
  });
  // Close dropdown so breadcrumb navigation isn't blocked by overlay
  cy.get('body').type('{esc}', { force: true });
};
