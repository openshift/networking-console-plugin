# Networking Console Plugin

OpenShift Console dynamic plugin for the Networking section UI. Provides UI views for managing kubernetes networking
resources. React + TypeScript + PatternFly, loaded via webpack module federation.

## Key Context Files

Read these files for full context before working on this codebase:

- [AGENTS.md](AGENTS.md) — AI-specific guidance: repo structure, key patterns, coding conventions, review guidelines
- [ARCHITECTURE.md](ARCHITECTURE.md) — system design: plugin registration, component architecture, data flow,
  dependencies
- [CONTRIBUTING.md](CONTRIBUTING.md) — coding standards, linting rules, PR process, testing

## Quick Reference

- **Components:** functional only, typed with `FC`, use PatternFly 6, default export for pages
- **Path aliases**: `@utils/*`, `@views/*`, `@styles/*`
- **i18n**: `useNetworkingTranslation()` hook or `Trans` component for all user-visible strings, never hardcode English,
  namespace `plugin__networking-console-plugin`
- **Imports:** sorted by `eslint-plugin-simple-import-sort` — React → external packages → internal `src/` →
  `@kubevirt-ui` → `@openshift-console` → `@patternfly` → CSS
- **Routing: `react-router` v7 (not `react-router-dom`)
- No `console.*` — use `networkConsole` from `@utils/utils/helpers`
- No hex colors — PatternFly CSS variables only
- **Linting:** ESLint + Prettier, single quotes, trailing commas, 100-char width, `simple-import-sort`
- **Views follow**: `actions/`, `details/`, `form/`, `list/`, `manifest.ts`
- **Feature flags**: `NET_ATTACH_DEF`, `KUBEVIRT_DYNAMIC`, `FLAG_UDN_ENABLED`
- **SDK hooks for K8s ops**: `useK8sWatchResource`, `k8sCreate`, `k8sPatch`, `k8sDelete`
- **Testing:** Cypress e2e (`npm run test-cypress`)
