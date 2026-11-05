/**
 * Synchronous helper for reading public configuration.
 * Public values (namespaces, flags) are injected via config.expose in
 * plugins/index.ts and are safe to expose to the browser. Sensitive values
 * must use cy.env() instead.
 */
export const getPublicEnv = (key: string): string | undefined => {
  const value = Cypress.expose(key) as unknown;
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
};

export const getPublicEnvFlag = (key: string): boolean => String(getPublicEnv(key)) === 'true';
