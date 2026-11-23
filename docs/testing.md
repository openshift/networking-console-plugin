# Testing

Three layers, cheapest first: unit, integration, and cluster-backed end to end. Put each
test in the lowest layer that can express the failure.

## Unit tests (Jest)

```bash
npm test                    # Unit Jest project
npm run test:coverage       # Run with coverage report
```

Unit files are `*.test.ts(x)` / `*.spec.ts(x)`; `jest.config.ts` excludes
`*.integration.test.*`. The SDK and assets are stubbed via `src/test/dummy.ts`, so these
tests need no network.

## Integration tests (Jest + React Testing Library + MSW)

The real component tree, hooks and selectors are rendered against test doubles for
`@openshift-console/dynamic-plugin-sdk`, `react-redux` and related modules; MSW answers the
Kubernetes API requests (`/api/...` / `/apis/...`) that the SDK shim in
`src/test/console-sdk-shim.tsx` issues. i18next is initialized from
`locales/en/plugin__networking-console-plugin.json`, so `t` interpolates against the real
English catalog.

Files are `*.integration.test.tsx`. `jest.integration.config.ts` uses
`testEnvironment: 'jest-fixed-jsdom'` and `setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']`.

The integration project runs as ESM: Jest starts with `--experimental-vm-modules` (see
`npm run test:integration`), and msw 3 needs Node 22.12 or newer.

```bash
npm run test:integration   # Integration project only
```

Payloads come from `src/test/fixtures/*.json`. Seed fixtures ship with the suite.
Helpers for common setup live under `src/test/` (`fixtures`, `msw`, `console-sdk-shim`).
