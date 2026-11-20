import { pathsToModuleNameMapper } from 'ts-jest';
import { readConfigFile, sys } from 'typescript';

import type { Config } from '@jest/types';

const { config: tsconfig } = readConfigFile('./tsconfig.json', sys.readFile);
const { compilerOptions } = tsconfig;

const moduleNameMapper = {
  '@console/*': '<rootDir>/src/__mocks__/dummy.ts',
  '@openshift-console/*': '<rootDir>/src/__mocks__/dummy.ts',
  '\\.(css|less|scss|svg)$': '<rootDir>/src/__mocks__/dummy.ts',
  ...pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
};

const cjsTransform: Config.InitialOptions['transform'] = {
  '^.+\\.[t|j]sx?$': [
    'ts-jest',
    {
      tsconfig: {
        ...compilerOptions,
        isolatedModules: true,
        module: 'commonjs',
        moduleResolution: 'node',
      },
    },
  ],
};

const shared: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
  modulePaths: ['<rootDir>'],
  testEnvironment: 'jest-environment-jsdom',
};

const config: Config.InitialOptions = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      moduleNameMapper,
      preset: 'ts-jest',
      setupFiles: ['<rootDir>/src/__mocks__/i18n.ts'],
      testMatch: [
        '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '!**/*.integration.test.{js,jsx,ts,tsx}',
      ],
      transform: cjsTransform,
      transformIgnorePatterns: [
        '<rootDir>/node_modules/(?!(@patternfly|@openshift-console\\S*?|@kubevirt-ui)/.*)',
      ],
    },
    {
      ...shared,
      displayName: 'integration',
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      moduleNameMapper: {
        '\\.svg$': '<rootDir>/src/__mocks__/integration/svg.ts',
        '^@openshift-console/dynamic-plugin-sdk/lib/app/core/reducers/coreSelectors$':
          '<rootDir>/src/__mocks__/integration/coreSelectors.ts',
        '^@openshift-console/dynamic-plugin-sdk$':
          '<rootDir>/src/__mocks__/integration/dynamic-plugin-sdk.tsx',
        '^react-redux$': '<rootDir>/src/__mocks__/integration/react-redux.tsx',
        '^react-router$': '<rootDir>/src/__mocks__/integration/react-router.tsx',
        ...moduleNameMapper,
      },
      setupFiles: [
        '<rootDir>/src/__mocks__/integration/nodeGlobals.ts',
        '<rootDir>/src/__mocks__/integration/i18n.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__mocks__/integration/setup.ts'],
      testEnvironment: 'jest-fixed-jsdom',
      testMatch: ['<rootDir>/src/**/*.integration.test.{js,jsx,ts,tsx}'],
      transform: {
        '^.+\\.[t|j]sx?$': [
          'ts-jest',
          { tsconfig: { ...compilerOptions, module: 'esnext' }, useESM: true },
        ],
      },
      transformIgnorePatterns: [
        '<rootDir>/node_modules/(?!(@patternfly|@openshift-console\\S*?|@kubevirt-ui)/.*)',
      ],
    },
  ],
};

export default config;
