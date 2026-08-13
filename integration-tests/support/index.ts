import './commands';
import './login';

declare global {
  interface Window {
    SERVER_FLAGS?: { authDisabled?: boolean };
    windowError?: string;
  }
}

const NETWORKING_I18N_NS = 'plugin__networking-console-plugin';

/**
 * Console aggregates missing-key warnings into window.windowError.
 * Ignore keys from other dynamic plugins (e.g. kubevirt) that this suite does not own.
 */
const isIgnorableWindowError = (raw: unknown): boolean => {
  const message = typeof raw === 'string' ? raw : String(raw ?? '');
  if (!message) {
    return true;
  }

  const parts = message
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return true;
  }

  return parts.every((part) => {
    const match = part.match(/Missing i18n key ".+" in namespace "([^"]+)"/);
    return match !== null && match[1] !== NETWORKING_I18N_NS;
  });
};

export const checkErrors = () =>
  cy.window().then((win) => {
    const err = win.windowError;
    if (!err || isIgnorableWindowError(err)) {
      win.windowError = undefined;
      return;
    }
    assert.isTrue(!err, err);
  });
