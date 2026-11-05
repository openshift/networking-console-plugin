import { MINUTE } from '../utils/const/base';

const KUBEADMIN_USERNAME = 'kubeadmin';
const KUBEADMIN_IDP = 'kube:admin';
const TOUR_DISMISS = '[data-test="tour-step-footer-secondary"]';
const USER_MENU = '[data-test="user-dropdown"], [data-test="user-dropdown-toggle"], #page-sidebar';
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

Cypress.Commands.add('login', (provider?: string, username?: string, password?: string) => {
  const usr = username || KUBEADMIN_USERNAME;
  const idp = provider || KUBEADMIN_IDP;
  // Resolve password: arg > cy.env() > task fallback. cy.env() is the
  // allowCypressEnv:false-safe way to read sensitive values in test code.
  const resolvePassword = (): Cypress.Chainable<string> => {
    if (password) return cy.wrap(password);
    return cy.env(['BRIDGE_KUBEADMIN_PASSWORD'], { log: false }).then((env) => {
      const fromEnv = env.BRIDGE_KUBEADMIN_PASSWORD as string | undefined;
      if (fromEnv) return fromEnv;
      return cy
        .task('getKubeadminPassword', null, { log: false })
        .then((taskPwd) => (taskPwd as null | string) || '');
    }) as Cypress.Chainable<string>;
  };

  resolvePassword().then((pwd) => {
    expect(pwd, 'BRIDGE_KUBEADMIN_PASSWORD (or password arg) must be set').to.be.a('string').and.not
      .be.empty;

    const baseUrl = Cypress.config('baseUrl') || '';
    const oauthOrigin = baseUrl
      .replace('console-openshift-console', 'oauth-openshift')
      .replace(/\/$/, '');

    // Enqueue the OAuth login. Must only be called once the AUT is on the
    // oauth origin, otherwise cy.origin() fails with an origin mismatch.
    const loginViaOAuth = (): void => {
      cy.origin(
        oauthOrigin,
        { args: { idp, minute: MINUTE, pwd, usr } },
        ({ idp: originIdp, minute, pwd: originPwd, usr: originUsr }) => {
          // IDP-enabled clusters show the provider list first ("kube:admin").
          cy.get('body', { timeout: 3 * minute }).should('be.visible');
          cy.get('body').then(($originBody) => {
            if ($originBody.find('#inputUsername').length === 0) {
              if ($originBody.text().includes(originIdp)) {
                cy.contains('a', originIdp).click();
              } else if ($originBody.text().includes('kubeadmin')) {
                cy.contains('a', 'kubeadmin').click();
              } else {
                cy.get('a').first().click();
              }
            }
          });
          cy.get('#inputUsername', { timeout: 3 * minute }).should('be.visible');
          cy.get('#inputUsername').clear();
          cy.get('#inputUsername').type(originUsr);
          cy.get('#inputPassword').clear();
          cy.get('#inputPassword').type(originPwd, { log: false });
          cy.get('button[type=submit]').click();
        },
      );
      cy.url({ timeout: 3 * MINUTE }).should('include', 'console-openshift-console');
      cy.get(USER_MENU, { timeout: 2 * MINUTE }).should('exist');
      dismissWelcomeTourIfPresent();
    };

    // Decide the auth state with an API probe: cy.request goes through the
    // Node proxy with the browser's cookie jar, so it never depends on which
    // origin the AUT is currently showing. A missing/expired session token
    // makes the console answer with a redirect (or 401/403) instead of 200.
    cy.request({
      failOnStatusCode: false,
      followRedirect: false,
      url: `${baseUrl}/api/kubernetes/version`,
    })
      .then((resp) => {
        if (resp.status === 200) {
          // Session still valid: just make sure the console shell is up.
          cy.visit('/');
          cy.window().then((win) => {
            if (win.SERVER_FLAGS?.authDisabled) {
              cy.log('authDisabled — skipping OAuth login');
              return;
            }
            cy.get(USER_MENU, { timeout: 2 * MINUTE }).should('exist');
            dismissWelcomeTourIfPresent();
          });
          return;
        }

        // Not signed in: drop any stale cookies, reload, and wait for the
        // redirect to land on the oauth origin BEFORE any DOM command.
        cy.clearAllCookies();
        cy.visit('/');
        cy.location('href', { timeout: 2 * MINUTE }).should('include', 'oauth-openshift');
        loginViaOAuth();
      })
      .then(() => undefined);
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      return;
    }

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
