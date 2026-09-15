// @ts-check
import { defineConfig, globalIgnores, includeIgnoreFile } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import pluginCypress from 'eslint-plugin-cypress';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

import js from '@eslint/js';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
  globalIgnores([
    'coverage/**',
    'i18n-scripts/**',
    '**/gui-test-screenshots/**',
    '**/cypress-a11y-report.json',
  ]),
  {
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      perfectionist.configs['recommended-alphabetical'],
    ],
    files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
    languageOptions: {
      ecmaVersion: 12,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: 'module',
    },
    name: 'networking/source',
    plugins: {
      'react-hooks': pluginReactHooks,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'error',
      'no-nested-ternary': 'error',
      'no-shadow': 'off',
      'perfectionist/sort-classes': [
        'error',
        {
          groups: [
            'static-property',
            'private-property',
            'property',
            'constructor',
            'static-method',
            'private-method',
            'method',
          ],
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-modules': 'off',
      'perfectionist/sort-named-imports': [
        'error',
        {
          ignoreAlias: true,
          ignoreCase: true,
        },
      ],
      'perfectionist/sort-sets': 'off',
      'perfectionist/sort-switch-case': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            [
              '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
            ],
            ['^react', '^\\w'],
            ['^(@|config/)(/*|$)'],
            ['^\\u0000'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
    },
    settings: {
      react: {
        version: '18.3',
      },
    },
  },
  {
    files: [
      'eslint.config.mjs',
      'i18next-parser.config.js',
      'webpack.config.ts',
      '**/cypress.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    name: 'networking/node-and-tooling',
  },
  {
    files: ['**/*.cjs', '**/cypress.config.js', 'i18next-parser.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    name: 'networking/commonjs',
  },
  {
    extends: [pluginCypress.configs.recommended],
    files: ['integration-tests/**', 'ui-tests-cy/**'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    name: 'networking/cypress',
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'no-redeclare': 'off',
    },
  },
  eslintConfigPrettier,
]);
