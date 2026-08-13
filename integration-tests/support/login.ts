declare global {
  namespace Cypress {
    interface Chainable {
      dismissWelcomeTourIfPresent(): Chainable;
      login(providerName?: string, username?: string, password?: string): Chainable<Element>;
      logout(): void;
    }
  }
}

const KUBEADMIN_USERNAME = 'kubeadmin';
const KUBEADMIN_IDP = 'kube:admin';
const TOUR_DISMISS = '[data-test="tour-step-footer-secondary"]';
const USER_MENU = '[data-test="user-dropdown"], [data-test="user-dropdown-toggle"], #page-sidebar';
const MINUTE = 60 * 1000;
const TOUR_WAIT_MS = 20_000;
const TOUR_POLL_MS = 500;

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
        return;
      }

      if (Date.now() >= deadline) {
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
    cy.get(USER_MENU, { timeout: MINUTE }).should('exist');
    dismissWelcomeTourIfPresent();
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      return;
    }

    // after() may run on about:blank when testIsolation is enabled
    cy.visit('/');
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="user-dropdown"]').length === 0) {
        cy.log('logout skipped: user menu not present');
        return;
      }
      cy.get('[data-test="user-dropdown"]').click();
      cy.get('[data-test="log-out"]').should('be.visible');
      cy.get('[data-test="log-out"]').click({ force: true });
    });
  });
});
