import { MINUTE } from '../utils/const/base';

const KUBEADMIN_USERNAME = 'kubeadmin';
const KUBEADMIN_IDP = 'kube:admin';
const TOUR_DISMISS = '[data-test="tour-step-footer-secondary"]';
const TOUR_WAIT_MS = 20_000;
const TOUR_POLL_MS = 500;

// The welcome tour only mounts on first login; once it has been dismissed or
// confirmed absent, later calls only need a single check instead of polling.
let welcomeTourSettled = false;

declare global {
  namespace Cypress {
    interface Chainable {
      dismissWelcomeTourIfPresent(): void;
      login(providerName?: string, username?: string, password?: string): Chainable<Element>;
      logout(): void;
    }
  }
}

/**
 * Fresh CI clusters show "Welcome to the new OpenShift experience!" after login.
 * The modal can mount after masthead is ready, so poll briefly without failing when absent.
 */
const dismissWelcomeTourIfPresent = () => {
  const deadline = Date.now() + TOUR_WAIT_MS;

  const tryDismiss = () => {
    cy.get('body').then(($body) => {
      if ($body.find(TOUR_DISMISS).length > 0) {
        cy.get(TOUR_DISMISS).click({ force: true });
        cy.get('.pf-v6-l-bullseye', { timeout: 15_000 }).should('not.exist');
        welcomeTourSettled = true;
        return;
      }

      if (welcomeTourSettled || Date.now() >= deadline) {
        welcomeTourSettled = true;
        return;
      }

      // Welcome modal mounts asynchronously on first login; poll until timeout.
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(TOUR_POLL_MS).then(tryDismiss);
    });
  };

  tryDismiss();
};

Cypress.Commands.add('dismissWelcomeTourIfPresent', dismissWelcomeTourIfPresent);

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
  dismissWelcomeTourIfPresent();
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
