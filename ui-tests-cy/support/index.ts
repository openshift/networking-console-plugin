import './login';
import './selectors';
import './commands';
import './nav';

Cypress.on('uncaught:exception', () => {
  return false;
});

if (Cypress.env('HIDE_XHR')) {
  const origLog = Cypress.log;
  Cypress.log = function (opts, ...other) {
    if (opts.displayName === 'fetch' || opts.displayName === 'xhr') {
      return;
    }
    return origLog(opts, ...other);
  };
}
