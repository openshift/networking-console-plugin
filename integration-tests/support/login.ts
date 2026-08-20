declare global {
  namespace Cypress {
    interface Chainable {
      login(providerName?: string, username?: string, password?: string): Chainable<Element>;
      logout(): void;
    }
  }
}

const KUBEADMIN_USERNAME = 'kubeadmin';
const KUBEADMIN_IDP = 'kube:admin';
const TOUR_DISMISS = '[data-test="tour-step-footer-secondary"]';
const MINUTE = 60 * 1000;

Cypress.Commands.add('login', (provider?: string, username?: string, password?: string) => {
  const usr = username || KUBEADMIN_USERNAME;
  const pwd = password || Cypress.env('BRIDGE_KUBEADMIN_PASSWORD');
  const idp = provider || KUBEADMIN_IDP;

  cy.visit('/');
  cy.window().then((win) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      return;
    }

    cy.clearCookie('openshift-session-token');

    cy.origin(
      Cypress.config('baseUrl').replace('console-openshift-console', 'oauth-openshift'),
      { args: { idp, pwd, usr } },
      ({ idp: originIdp, pwd: originPwd, usr: originUsr }) => {
        cy.get('body', { timeout: 180000 }).should('be.visible');
        cy.get('body').then(($body) => {
          if ($body.find('#inputUsername').length === 0) {
            if ($body.text().includes(originIdp)) {
              cy.contains('a', originIdp).click();
            } else if ($body.text().includes('kubeadmin')) {
              cy.contains('a', 'kubeadmin').click();
            } else {
              cy.get('a').first().click();
            }
          }
        });
        cy.get('#inputUsername', { timeout: 180000 }).should('be.visible');
        cy.get('#inputUsername').type(originUsr);
        cy.get('#inputPassword').type(originPwd, { log: false });
        cy.get('button[type=submit]').click();
      },
    );

    cy.url({ timeout: 2 * MINUTE }).should('include', 'console-openshift-console');
    cy.get('body').then(($body) => {
      if ($body.find(TOUR_DISMISS).length) {
        cy.get(TOUR_DISMISS).click();
      }
    });
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      return;
    }
    cy.get('[data-test="user-dropdown"]').click();
    cy.get('[data-test="log-out"]').should('be.visible');
    cy.get('[data-test="log-out"]').click({ force: true });
  });
});
