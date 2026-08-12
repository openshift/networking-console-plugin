import Loggable = Cypress.Loggable;
import Timeoutable = Cypress.Timeoutable;
import Withinable = Cypress.Withinable;
import Shadow = Cypress.Shadow;
import { MINUTE, SECOND } from '../utils/const/base';

export {};
declare global {
  namespace Cypress {
    interface Chainable {
      byButtonText(selector: string): Chainable;
      byLegacyTestID(selector: string): Chainable;
      byTestActionID(selector: string): Chainable;
      byTestID(
        selector: string,
        options?: Partial<Loggable & Shadow & Timeoutable & Withinable>,
      ): Chainable;
      byTestRows(selector: string): Chainable;
      checkSubTitle(title: string, timeout?: number): void;
      checkTitle(title: string, timeout?: number): void;
      clickBtn(btnTxt: string): void;
      clickNavLink(path: [string, string?]): Chainable;
      clickNextBtn(): void;
      clickSaveBtn(): void;
    }
  }
}

Cypress.Commands.add(
  'byTestID',
  (selector: string, options?: Partial<Loggable & Shadow & Timeoutable & Withinable>) => {
    cy.get(`[data-test="${selector}"]`, options);
  },
);

Cypress.Commands.add('byLegacyTestID', (selector: string) =>
  cy.get(`[data-test-id="${selector}"]`, { timeout: MINUTE * 3 }),
);

Cypress.Commands.add('byTestRows', (selector: string) =>
  cy.get(`[data-test-rows="${selector}"]`, { timeout: MINUTE }),
);

Cypress.Commands.add('byTestActionID', (selector: string) =>
  cy.get(`[data-test-action="${selector}"]:not(.pf-m-disabled)`),
);

Cypress.Commands.add('clickNavLink', (path: [string, string?]) => {
  cy.byTestID('nav', { timeout: MINUTE })
    .contains(path[0], { timeout: SECOND * 10 })
    .should(($el) => {
      if ($el.attr('aria-expanded') == 'false') {
        $el.click();
      }
    });
  if (path.length > 1) {
    cy.get('#page-sidebar').contains(path[1]).click();
  }
});

Cypress.Commands.add('byButtonText', (selector: string) => cy.contains('button', `${selector}`));

Cypress.Commands.add('clickSaveBtn', () => {
  cy.get('button[data-test="save-button"]').click({ force: true });
});

Cypress.Commands.add('checkTitle', (title: string, timeout?: number) => {
  const t_o = timeout ? timeout : MINUTE * 3;
  cy.contains('h1', title, { timeout: t_o }).should('exist');
});

Cypress.Commands.add('checkSubTitle', (subTitle: string, timeout?: number) => {
  const t_o = timeout ? timeout : MINUTE * 3;
  cy.contains('h2', subTitle, { timeout: t_o }).should('exist');
});

Cypress.Commands.add('clickNextBtn', () => cy.contains('button[type="submit"]', 'Next').click());

Cypress.Commands.add('clickBtn', (btnTxt?: string) => {
  return cy.contains('button[type="submit"]', btnTxt).click();
});
