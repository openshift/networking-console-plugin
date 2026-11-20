import { pathsToModuleNameMapper } from 'ts-jest';
import { readConfigFile, sys } from 'typescript';

import type { Config } from '@jest/types';

const { config: tsconfig } = readConfigFile('./tsconfig.json', sys.readFile);
const { compilerOptions } = tsconfig;

/* Integration tests render real components and hooks while the console SDK is
 * replaced by a test shim that fetches over HTTP, so MSW can serve responses
 * recorded from a live cluster. Unit tests keep using jest.config.ts.
 *
 * msw 3 is ESM-only and needs Node 22.12+, so this project runs under Jest's
 * ESM runtime: start Jest with NODE_OPTIONS=--experimental-vm-modules (see the
 * test:integration scripts), treat TypeScript as ESM with
 * extensionsToTreatAsEsm and let ts-jest emit ESM. There is no CommonJS build
 * mapping for msw and no transform for its ESM-only dependencies.
 *
 * `jest-fixed-jsdom` is a jsdom environment that keeps Node's WHATWG globals
 * (fetch, Request, Response, MessagePort, streams), which MSW requires. */
const config: Config.InitialOptions = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
  moduleNameMapper: {
    // Asset imports are matched before the @styles path alias, otherwise an scss
    // file resolved through the alias would be loaded as JavaScript.
    '\\.(css|scss|sass|svg|png|jpe?g|gif)$': '<rootDir>/src/test/style-mock.cjs',
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    '^@openshift-console/dynamic-plugin-sdk-internal$':
      '<rootDir>/src/test/console-sdk-internal-shim.tsx',
    '^@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status$':
      '<rootDir>/src/test/status-shim.tsx',
    '^@openshift-console/dynamic-plugin-sdk$': '<rootDir>/src/test/console-sdk-shim.tsx',
    // `@patternfly` ships ESM sources under dist/esm in packages that are not
    // `"type": "module"`, so a deep import there is ESM syntax Jest reads as
    // CommonJS. Point the deep paths at the published CommonJS builds, and d3
    // (ESM-only) at its published UMD bundle.
    '^@patternfly/react-charts/dist/esm/(.*)$':
      '<rootDir>/node_modules/@patternfly/react-charts/dist/js/$1',
    '^@patternfly/react-topology/dist/esm/(.*)$':
      '<rootDir>/node_modules/@patternfly/react-topology/dist/js/$1',
    // Resolve the published CJS build instead of the package's TS sources.
    '^@patternfly/react-topology$':
      '<rootDir>/node_modules/@patternfly/react-topology/dist/js/index.js',
    // Every d3 package is ESM-only (`main` is dist/<name>.mjs) but publishes a
    // UMD build under the same name; `exports.umd` selects it.
    '^d3(-[a-z0-9-]+)?$': '<rootDir>/node_modules/d3$1/dist/d3$1.min.js',
  },
  setupFiles: ['<rootDir>/src/test/nodeGlobals.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testEnvironment: 'jest-fixed-jsdom',
  testMatch: ['<rootDir>/src/**/*.integration.test.{ts,tsx}'],
  transform: {
    '^.+\\.[t|j]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          ...compilerOptions,
          allowJs: true,
          checkJs: false,
          isolatedModules: true,
          jsx: 'react-jsx',
          module: 'esnext',
        },
        useESM: true,
      },
    ],
  },
  // `@patternfly` packages are CommonJS-typed yet ship ESM sources
  // (`react-data-view`'s CommonJS build requires `react-tokens/dist/esm/*`), so
  // they must be transformed rather than loaded as-is; ts-jest emits each file
  // in the format Jest loads it in.
  transformIgnorePatterns: [
    '/node_modules/(?!(@patternfly|@openshift-console\\S*?|@kubevirt-ui-ext)/)',
  ],
};

export default config;
