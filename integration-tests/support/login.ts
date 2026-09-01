declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<Element>;
      logout(): Chainable<Element>;
    }
  }
}

const KUBEADMIN_USERNAME = 'kubeadmin';
const loggedInSelector =
  '[data-test="user-dropdown-toggle"], [data-test="user-dropdown"], [data-test="username"]';
const kubeadminAliases = new Set(['kubeadmin', 'kube:admin']);

type ConsoleWindow = { SERVER_FLAGS?: { authDisabled?: boolean } } & Window;

const typeLoginForm = (user: string, pwd: string) => {
  cy.get('#inputUsername').type(user);
  cy.get('#inputPassword').type(pwd, { log: false });
  cy.get('#co-login-button, button[type=submit]').click();
};

const displayedIdentity = ($body: JQuery<HTMLElement>): string =>
  $body.find(loggedInSelector).first().text().trim().toLowerCase();

const isDisplayedUser = (user: string, $body: JQuery<HTMLElement>): boolean => {
  const displayed = displayedIdentity($body);
  const requested = user.toLowerCase();
  if (kubeadminAliases.has(requested)) {
    return kubeadminAliases.has(displayed) || displayed.includes('kube:admin');
  }
  return Boolean(displayed) && displayed.includes(requested);
};

const logoutFromMasthead = () => {
  cy.get(loggedInSelector).first().click();
  cy.get('[data-test="log-out"]').should('be.visible');
  cy.get('[data-test="log-out"]').click({ force: true });
};

// This will add 'cy.login(...)'
// ex: cy.login('my-user', 'my-password')
Cypress.Commands.add('login', (username?: string, password?: string) => {
  const user = username || KUBEADMIN_USERNAME;
  const pwd = password || Cypress.env('BRIDGE_KUBEADMIN_PASSWORD');

  cy.visit('/');
  cy.window().then((win: ConsoleWindow) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      return;
    }

    cy.get(`#inputUsername, ${loggedInSelector}`, { timeout: 60000 }).should('exist');
    cy.get('body').then(($body) => {
      if ($body.find('#inputUsername').length) {
        typeLoginForm(user, pwd);
        return;
      }

      const reuseSession = !username || isDisplayedUser(user, $body);
      if (reuseSession) {
        return;
      }

      logoutFromMasthead();
      cy.get('#inputUsername', { timeout: 60000 }).should('be.visible');
      typeLoginForm(user, pwd);
    });
    cy.get(loggedInSelector, { timeout: 120000 }).should('be.visible');
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win: ConsoleWindow) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      return;
    }
    cy.get('body').then(($body) => {
      if (!$body.find(loggedInSelector).length) {
        return;
      }
      logoutFromMasthead();
    });
  });
});
