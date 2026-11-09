import { pathsToModuleNameMapper } from 'ts-jest';
import { readConfigFile, sys } from 'typescript';

import type { Config } from '@jest/types';

const { config: tsconfig } = readConfigFile('./tsconfig.json', sys.readFile);
const { compilerOptions } = tsconfig;

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/src/**/*.{test,spec}.{ts,tsx}'],
  transform: {
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
  },
};

export default config;
