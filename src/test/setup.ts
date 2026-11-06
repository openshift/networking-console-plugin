/* eslint-disable no-console -- this file replaces the console methods so test
 * output can be asserted instead of printed (jest hides it in CI). */
import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

import { cleanup } from '@testing-library/react';

import '@testing-library/jest-dom';

import { resetTestFlags } from './console-sdk-shim';
import { server, unhandledRequests } from './msw';

// Translated components call useTranslation; without an instance, i18next throws.
// Keys are returned as-is, which is what the assertions match on.
void i18next.use(initReactI18next).init({
  defaultNS: 'plugin__networking-console-plugin',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  lng: 'en',
  ns: ['plugin__networking-console-plugin'],
  resources: { en: { 'plugin__networking-console-plugin': {} } },
});

// The console injects SERVER_FLAGS into the page; modules read it at import time
// for URLs such as the Prometheus base path.
const consoleGlobals = globalThis as {
  SERVER_FLAGS?: Record<string, string>;
} & typeof globalThis;
consoleGlobals.SERVER_FLAGS = {
  prometheusBaseURL: '/api/prometheus',
  prometheusTenancyBaseURL: '/api/prometheus-tenancy',
  ...consoleGlobals.SERVER_FLAGS,
};

/* Console output is captured and asserted instead of printed: jest's reporter
 * only shows per-test console output in verbose mode, which CI does not use, so
 * a new React or PatternFly warning would otherwise be invisible there. Capturing
 * at module scope also catches warnings emitted while a test file is imported. */
const consoleEvents: string[] = [];
const originalConsole = { error: console.error, warn: console.warn };

const recordConsole =
  (level: 'error' | 'warn') =>
  (...args: unknown[]): void => {
    consoleEvents.push(
      `${level}: ${args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' ')}`,
    );
  };

console.error = recordConsole('error');
console.warn = recordConsole('warn');

/* An unhandled request is recorded and then thrown, which aborts it the way the
 * 'error' strategy did: recording alone would leave MSW to pass the request
 * through to the real network. Either way the owning test fails in afterEach. */
beforeAll(() =>
  server.listen({
    onUnhandledRequest: (request) => {
      const label = `${request.method} ${request.url}`;

      unhandledRequests.push(label);

      throw new Error(`unhandled request: ${label}`);
    },
  }),
);

afterAll(() => {
  server.close();
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

afterEach(() => {
  cleanup();
  resetTestFlags();

  const unexpectedRequests = unhandledRequests.splice(0);
  const unexpectedConsole = consoleEvents.splice(0);

  server.resetHandlers();

  expect(unexpectedConsole).toEqual([]);
  expect(unexpectedRequests).toEqual([]);
});
