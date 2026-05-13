# Contributing to Networking Console Plugin

## Getting Started

For initial setup (prerequisites, clone, install, dev server), see [README.md](README.md#quick-start).

## Coding Standards

### TypeScript and React

- Target ES2016 with ESNext modules. The project uses `esbuild-loader` for fast transpilation.
- Follow the ESLint config in `.eslintrc.json` — run `npm run lint` before submitting.
- Import ordering is enforced by `simple-import-sort`: Node builtins, packages (React first), internal `@`-prefixed
  paths, relative paths, then styles.
- Use `@utils/*`, `@views/*`, `@styles/*` path aliases rather than deep relative paths.
- Use `no-console` — call `networkConsole` from `@utils/utils/helpers` instead of `console.*` directly.
- Unused variables prefixed with `_` are allowed; all others trigger an error.

### Component Patterns

- Each view follows the structure: `actions/`, `details/`, `form/`, `list/`, plus a `manifest.ts` that declares console
  extensions and exposed modules.
- List views use the SDK's `VirtualizedTable`, `ListPageBody`, `ListPageFilter`, and `ListPageHeader` components.
- Forms use `react-hook-form`.
- Routing uses `react-router` (v7). Import `Link`, `useNavigate`, `useLocation`, and `useParams` from `react-router`.
- K8s resource operations use SDK hooks: `useK8sWatchResource`, `k8sCreate`, `k8sPatch`, `k8sDelete`.
- Functional components only, typed with `FC` from React
- Use PatternFly 6 components for all UI — no custom HTML elements for standard patterns
- One component per file — utility files, types (aside from props), constants, etc. go in a `utils/` folder within the
  component's directory
- Define props as TypeScript `type` in the same file or a co-located `types.ts`
- Default export for page-level components

### Styling

- Use PatternFly components and global CSS variables. No hex colors (dark mode compatibility).
- Prefix custom CSS classnames with the plugin name.
- SCSS files are co-located with their components and have the same name as the component file, but with the 'scss'
  extension.

### Internationalization

- Use the `useNetworkingTranslation` hook (wraps `useTranslation('plugin__networking-console-plugin')`).
- For JSX-embedded translations, use the `Trans` component from `react-i18next`.
- After adding or changing translatable strings, run `npm run i18n` and commit the updated `locales/` files.
- The i18n CI check (`test-frontend.sh`) verifies locale files are current.

## PR Process

This project uses the Prow-based OpenShift CI system with [OWNERS](OWNERS)-driven review.

### Workflow

1. Fork the repo and create a feature branch from `main`.
2. Make changes, run `npm run lint` and fix any issues.
3. If you changed translatable strings, run `npm run i18n` and commit the locale updates.
4. Open a PR against `main`
   in [openshift/networking-console-plugin](https://github.com/openshift/networking-console-plugin).
5. Reference the Jira ticket in the PR title: `OCPBUGS-NNNNN: description` or `CNV-NNNNN: description`.

### Review and Merge

The OWNERS file defines two roles:

- **Reviewers** review code and apply the `lgtm` label via `/lgtm`.
- **Approvers** approve the PR for merge via `/approve`.

PRs require approval from at least one person in the reviewer list and a different person from the approver list
in [OWNERS](OWNERS). If the submitter is in one of the lists, their ack is added automatically

### Release branches

The repo maintains multiple active release branches (`release-4.17`, `release-4.18`, ..., `release-4.23`). Each branch
tracks a specific OpenShift release:

- **`main`** — development branch for the next release
- **`release-X.Y`** — stable branch for OpenShift X.Y; receives bug fixes and CVE remediations via cherry-picks
- SDK version must correspond to the target release branch (e.g., `release-4.22` uses SDK 4.22.x)

### Cherry-Picks

CVE remediations and bug fixes are cherry-picked to active release branches (`release-4.16` through the current
release). Cherry-pick PRs use the title format `[release-X.YY] OCPBUGS-NNNNN: description` and reference the main-branch
PR.

## Testing

- **Lint**: `npm run lint` (ESLint + Prettier)
- **i18n check**: `npm run i18n` then verify `git status --short locales` shows no changes
- **Cypress E2E**: `npm run test-cypress-headless` (requires a running OpenShift cluster)

E2E specs live in `integration-tests`. Tests run against http://localhost:9000 by default (override with
`BRIDGE_BASE_ADDRESS`).

CI runs `test-frontend.sh` (i18n validation) and `test-prow-e2e.sh` (Cypress against a live cluster) on every PR.

## Commit Conventions

- Reference the Jira ticket in the commit or PR title: `OCPBUGS-NNNNN: fix description` or `CNV-NNNNN: add feature`.
- Keep commits focused on a single change.
