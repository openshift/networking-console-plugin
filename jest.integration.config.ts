import { pathsToModuleNameMapper } from 'ts-jest';
import { readConfigFile, sys } from 'typescript';

import type { Config } from '@jest/types';

const { config: tsconfig } = readConfigFile('./tsconfig.json', sys.readFile);
const { compilerOptions } = tsconfig;

/* Integration tests render real components and hooks while the console SDK is
 * replaced by a test shim that fetches over HTTP, so MSW can serve responses
 * recorded from a live cluster. Unit tests keep using jest.config.ts.
 *
 * `jest-fixed-jsdom` is a jsdom environment that keeps Node's WHATWG globals
 * (fetch, Request, Response, MessagePort, streams), which MSW requires. */
const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  moduleNameMapper: {
    // Asset imports are matched before the @styles path alias, otherwise an scss
    // file resolved through the alias would be loaded as JavaScript.
    '\\.(css|scss|sass|svg|png|jpe?g|gif)$': '<rootDir>/src/test/style-mock.ts',
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    '^@openshift-console/dynamic-plugin-sdk-internal$':
      '<rootDir>/src/test/console-sdk-internal-shim.tsx',
    '^@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status$':
      '<rootDir>/src/test/status-shim.tsx',
    '^@openshift-console/dynamic-plugin-sdk$': '<rootDir>/src/test/console-sdk-shim.tsx',
    // Resolve the published CJS build instead of the package's TS sources.
    '^@patternfly/react-topology$':
      '<rootDir>/node_modules/@patternfly/react-topology/dist/js/index.js',
    // Jest resolves msw's export map to its TypeScript sources, which are ESM;
    // point at the published CommonJS builds instead.
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
  },
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testEnvironment: 'jest-fixed-jsdom',
  // Force the CommonJS build of packages that publish ESM-first (msw): Jest's
  // runtime is CJS, so the default `import` condition breaks require().
  testEnvironmentOptions: { customExportConditions: ['node'] },
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
          module: 'commonjs',
          moduleResolution: 'node',
        },
      },
    ],
  },
  // msw 2 ships some dependencies as ESM only; compile those to CJS so Jest's
  // CommonJS runtime can load them.
  transformIgnorePatterns: [
    '/node_modules/(?!(until-async|rettime|@mswjs/interceptors|headers-polyfill|outvariant|strict-event-emitter|@patternfly/react-icons|@patternfly/react-core|@patternfly/react-component-groups|@patternfly/react-data-view|@patternfly/react-tokens|@patternfly/react-table)/)',
  ],
};

export default config;
