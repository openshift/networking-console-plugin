declare global {
  interface Window {
    SERVER_FLAGS?: { authDisabled?: boolean };
    windowError?: string;
  }
}

const NETWORKING_I18N_NS = 'plugin__networking-console-plugin';

const IGNORABLE_ERROR_FRAGMENTS = [
  'loadPlugin failed',
  'plugin-manifest.json timed out',
  'Failed to load plugin manifest',
];

/**
 * Console aggregates missing-key warnings into window.windowError.
 * Ignore individual errors from other dynamic plugins (e.g. kubevirt) that this
 * suite does not own, but keep networking-plugin errors reportable even when
 * they are aggregated with an ignorable error.
 */
const isIgnorableErrorPart = (part: string): boolean => {
  const missingKey = part.match(/^Missing i18n key "[^"]+" in namespace "([^"]+)"$/);
  if (missingKey) {
    return missingKey[1] !== NETWORKING_I18N_NS;
  }

  return IGNORABLE_ERROR_FRAGMENTS.some((fragment) => part.includes(fragment));
};

const isIgnorableWindowError = (raw: unknown): boolean => {
  const message = typeof raw === 'string' ? raw : String(raw ?? '');
  const parts = message
    .split(/[;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.every(isIgnorableErrorPart);
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
