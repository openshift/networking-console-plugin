# Testing

Three layers, cheapest first: unit, integration, and cluster-backed end to end. Put each
test in the lowest layer that can express the failure.

## Unit tests (Jest)

```bash
npm test                    # Both Jest projects plus the sanitizer tests
npm run test:coverage       # Run with coverage report
npm run test:unit           # Unit project only
```

Unit files are `*.test.ts(x)` / `*.spec.ts(x)`; the `unit` project's `testMatch` in
`jest.config.ts` excludes `*.integration.test.*`. The SDK is mocked via `src/__mocks__/`, so
these tests need no network.

## Integration tests (Jest + React Testing Library + MSW)

The real component tree, hooks and selectors are rendered against test doubles for
`@openshift-console/dynamic-plugin-sdk`, `react-redux` and `react-router`; MSW answers the
console-proxy requests (`/api/kubernetes/...`) that the SDK double in
`src/__mocks__/integration/dynamic-plugin-sdk.tsx` issues. i18next is initialized from
`locales/en/plugin__networking-console-plugin.json`, so `t` interpolates against the real
English catalog.

Files are `*.integration.test.tsx`. `jest.config.ts` declares the second project with
`testEnvironment: 'jest-fixed-jsdom'` and
`setupFilesAfterEnv: ['<rootDir>/src/__mocks__/integration/setup.ts']`.

The integration project runs as ESM: Jest starts with `--experimental-vm-modules` (see
`npm run test:integration`), and msw 3 needs Node 22.12 or newer.

```bash
npm run test:integration   # Integration project only
```

Payloads come from `src/__mocks__/integration/recordings/*.json`. Seed fixtures ship with
the suite; re-record them from a live cluster with the script below.

## Re-recording fixtures

`scripts/record-integration-fixtures.mjs` reads the current `oc` context and rewrites
`src/__mocks__/integration/recordings/{namespace,namespace-with-settings,nads,multus-daemon-config}.json`.
`--context <name>` pins a cluster; `--namespace <name>` selects the project whose Network
Settings tab the suite exercises (required); `--only <items>` narrows the run.

```bash
CTX=<cluster-name>
NS=<project-with-nads>
node scripts/record-integration-fixtures.mjs --context "$CTX" --namespace "$NS"
```

The recorder sanitizes as it writes — the source project name becomes `net-int-project`,
IP/MAC into documentation ranges — and refuses to overwrite `nads.json` with an empty list.
Review a fresh recording for internal domains and other identifying data before committing it.
If NAD or project names change, update the literal expectations in
`ProjectNetworkSettingsTab.integration.test.tsx`.
