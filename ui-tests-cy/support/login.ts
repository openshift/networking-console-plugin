import { MINUTE } from '../utils/const/base';

const KUBEADMIN_USERNAME = 'kubeadmin';
const KUBEADMIN_IDP = 'kube:admin';
const TOUR_DISMISS = '[data-test="tour-step-footer-secondary"]';

declare global {
  namespace Cypress {
    interface Chainable {
      login(providerName?: string, username?: string, password?: string): Chainable<Element>;
      logout(): void;
    }
  }
}

Cypress.Commands.add('login', (provider: string, username: string, password: string) => {
  cy.visit('');

  // In no-auth mode (hot-cluster CI with bearer-token), there's no login page.
  // Detect by checking if we land directly on the console dashboard.
  cy.url({ timeout: 3 * MINUTE }).then((url) => {
    if (url.includes('/dashboards') || url.includes('/k8s/') || url.includes('/overview')) {
      cy.log('No-auth mode detected — skipping login');
    } else if (url.includes('oauth') || url.includes('login') || url.includes('dex')) {
      const usr = username || KUBEADMIN_USERNAME;
      const pwd = password || Cypress.env('BRIDGE_KUBEADMIN_PASSWORD');
      const idp = provider || KUBEADMIN_IDP;

      cy.origin(
        url.split('/').slice(0, 3).join('/'),
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
    }
  });

  // Wait for console to be loaded (works in both auth and no-auth modes)
  cy.get('body', { timeout: 3 * MINUTE }).should('be.visible');
  cy.get('body').then(($body) => {
    if ($body.find(TOUR_DISMISS).length) {
      cy.get(TOUR_DISMISS).click();
    }
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-test="user-dropdown"]').length) {
      cy.get('[data-test="user-dropdown"]').click();
      cy.get('[data-test="log-out"]').should('be.visible');
      cy.get('[data-test="log-out"]').click({ force: true });
    }
  });
});
