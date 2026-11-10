/* eslint-disable no-console -- this file replaces the console methods so test
 * output can be asserted instead of printed (jest hides it in CI). */
import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';
import { readFileSync } from 'node:fs';

import { afterAll, afterEach, beforeAll, expect } from '@jest/globals';
import { cleanup } from '@testing-library/react';

import '@testing-library/jest-dom/jest-globals';

import * as appModels from '../utils/models';

import { registerK8sModels, resetTestFlags } from './console-sdk-shim';
import { server, unhandledRequests } from './msw';

/* Translated components call useTranslation; without an instance, i18next throws.
 * The real English catalog is loaded so `t` and `Trans` interpolate and pluralize
 * as they do in the console, and the assertions then match rendered text. */
const namespace = 'plugin__networking-console-plugin';
const translations = JSON.parse(
  readFileSync(
    new URL('../../locales/en/plugin__networking-console-plugin.json', import.meta.url),
    'utf8',
  ),
) as Record<string, string>;

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    defaultNS: namespace,
    fallbackLng: 'en',
    initAsync: false,
    interpolation: { escapeValue: false },
    // The catalog is flat and its keys contain dots (128 such keys).
    keySeparator: false,
    lng: 'en',
    ns: [namespace],
    nsSeparator: '~',
    react: { useSuspense: false },
    resources: { en: { [namespace]: translations } },
  });
}

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

/* Model plurals come from the plugin's own registry. They are imported here
 * rather than by the shim because the shim is already on the import path of that
 * module; registration therefore completes before the first test body, not before
 * a test file's module scope. */
beforeAll(() => {
  registerK8sModels(appModels as Record<string, unknown>);

  /* An unhandled frame is recorded with the same `METHOD URL` label the tests
   * key their handlers by, and then thrown, which errors the request: recording
   * alone would leave msw to pass it through to the real network. msw 3's
   * `defaults.error()` only prints, so the callback throws instead. */
  server.listen({
    onUnhandledFrame: ({ frame }) => {
      const { request } = frame.data as { request: Request };
      const label = `${request.method} ${request.url}`;

      unhandledRequests.push(label);

      throw new Error(`unhandled request: ${label}`);
    },
  });
});

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
