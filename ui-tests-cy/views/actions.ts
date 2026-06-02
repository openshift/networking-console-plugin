export const nameInput = 'input#name';

export const getRow = (name: string, within: VoidFunction) =>
  cy.byTestRows('resource-row').contains(name).parents('tr').within(within);

export const checkActionMenu = (item: string) => {
  cy.byButtonText('Actions').click();
  cy.contains('button', 'Edit labels').should('exist');
  cy.contains('button', 'Edit annotations').should('exist');
  cy.contains('button', `Edit ${item}`).should('exist');
  cy.contains('button', `Delete ${item}`).should('exist');
};
