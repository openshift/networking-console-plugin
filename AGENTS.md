# Agents Guide — Networking Console Plugin

AI-specific guidance for agents working in this codebase. For coding standards and PR process,
see [CONTRIBUTING.md](CONTRIBUTING.md). For system design, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Project Overview

This is an OpenShift console dynamic plugin for kubernetes networking. It provides UI views for managing
network policies, network attachment definitions, ingresses, routes, services, and user-defined networks.

## Repository Structure

```text
src/
  views/                  # Feature modules — one per networking resource kind
    ingresses/            # Ingress CRUD views
    nads/                 # NetworkAttachmentDefinition views
    networkpolicies/      # NetworkPolicy views (includes MultiNetworkPolicy)
    routes/               # Route views (includes form-based create/edit)
    services/             # Service views
    udns/                 # UserDefinedNetwork and ClusterUserDefinedNetwork views
    createprojectmodal/   # Modal for creating projects with UDN association
  utils/
    components/           # Shared UI components (modals, selectors, labels, empty states)
    constants/            # App-wide constants (documentation URLs, routes, UI flags)
    flags/                # Feature flags (NET_ATTACH_DEF, KUBEVIRT_DYNAMIC, FLAG_UDN_ENABLED)
    hooks/                # Shared hooks (useNetworkingTranslation, useQueryParams, usePagination)
    models/               # K8sModel definitions for CRDs (UDN, CUDN, MultiNetworkPolicy, etc.)
    resources/            # Resource fetch helpers (NADs, NetworkPolicies, UDNs, VMs)
    telemetry/            # Segment analytics event logging
    utils/                # Pure utility functions (sorting, time, units, helpers)
    types.ts              # Shared TypeScript types
  templates/              # YAML templates for resource creation (Ingress, NAD, Route, Service, UDN)
  styles/                 # Global SCSS
integration-tests/        # Cypress E2E tests
  tests/                  # Test specs (.cy.ts files)
  fixtures/               # Test data
  support/                # Cypress support files
locales/                  # i18n translation files (en, es, fr, ja, ko, zh)
charts/                   # Helm chart for cluster deployment
plugin-manifest.ts        # Console plugin entry point — registers all extensions and exposed modules
webpack.config.ts         # Webpack config with ConsoleRemotePlugin
```

## View Module Pattern

Each view under `src/views/{resource}/` follows a consistent structure:

| Directory     | Purpose                                                               |
|---------------|-----------------------------------------------------------------------|
| `actions/`    | Action provider hooks (delete, edit) registered as console extensions |
| `details/`    | Detail page with tabbed views (details, YAML)                         |
| `form/`       | Form-based create/edit using `react-hook-form`                        |
| `list/`       | List page with `VirtualizedTable`, filters, columns                   |
| `manifest.ts` | Console extension declarations and exposed module map                 |

The `manifest.ts` files declare `EncodedExtension[]` arrays and `ExposedModules` maps. These are aggregated in the root
`plugin-manifest.ts`.

## Key Patterns

### K8s Resource Models

CRD models are defined in `src/utils/models/`. Each model specifies `apiGroup`, `apiVersion`, `kind`, and plural. Models
are referenced in manifests for console extension registration:

- `k8s.cni.cncf.io/v1` — NetworkAttachmentDefinition, MultiNetworkPolicy (v1beta1)
- `k8s.ovn.org/v1` — UserDefinedNetwork, ClusterUserDefinedNetwork
- `operator.openshift.io/v1` — Network (operator config)
- `nmstate.io/v1` — NodeNetworkConfigurationPolicy

### Feature Flags

Feature flags in `src/utils/flags/consts.ts` gate UI sections:

- `NET_ATTACH_DEF` — NAD CRD exists on the cluster
- `KUBEVIRT_DYNAMIC` — KubeVirt operator is installed
- `FLAG_UDN_ENABLED` — UDN CRD exists on the cluster

The `enableNetworkingDynamicFlag.ts` and `useUDNEnabledFlag.ts` detect CRD availability at runtime.

### SDK Imports

- Console SDK: `@openshift-console/dynamic-plugin-sdk` — hooks (`useK8sWatchResource`, `useActiveNamespace`), CRUD
  functions, and UI primitives
- SDK internals: `@openshift-console/dynamic-plugin-sdk-internal` — telemetry (`getSegmentAnalytics`)
- KubeVirt API: `@kubevirt-ui/kubevirt-api/console` — `modelToGroupVersionKind`, `modelToRef`, and Kubernetes type
  definitions

### Translation

Two patterns are used together:

1. `useNetworkingTranslation()` hook — returns `{ t }` bound to `plugin__networking-console-plugin` namespace
2. `Trans` component from `react-i18next` — for translations containing embedded JSX

For non-component contexts, use a function in the non-component file that accepts an argument named 't' of type
TFunction and use it to translate the string.

### Telemetry

Events are tracked via `logNetworkingEvent` in `src/utils/telemetry/telemetry.ts`. Track calls include
`category: 'networking'` and resource-specific properties (topology, subnet count, CIDR prefixes). In development mode,
disabled telemetry logs warnings via `networkConsole.warn`.

### Routing

All routing uses `react-router` v7. Import `Link`, `useNavigate`, `useLocation`, `useParams` from `react-router` (not
`react-router-dom`).

### Webpack Alias

`@console/internal` is aliased to `@openshift-console/dynamic-plugin-sdk/lib` in `webpack.config.ts`.

## Review Checklist

When reviewing changes in this repo:

- [ ] Import order follows `simple-import-sort` groups (run `npm run lint`)
- [ ] All user-visible strings must use the `useNetworkingTranslation` hook or the `Trans` component; never hardcode
  English text
- [ ] New translatable strings have been extracted (`npm run i18n`) and locale files committed
- [ ] No `console.*` calls — use `networkConsole` from `@utils/utils/helpers`
- [ ] No hex colors in SCSS — use PatternFly CSS variables
- [ ] No `.pf-` or `.co-` class overrides or naked element selectors
- [ ] New views follow the `actions/details/form/list/manifest.ts` structure
- [ ] Feature-gated views use the appropriate flag from `src/utils/flags/consts.ts`
- [ ] Path aliases (`@utils/`, `@views/`, `@styles/`) used instead of deep relative imports
- [ ] Console SDK hooks used for K8s resource operations (not direct API calls)
- [ ] Component isolation — one component per file; single-use hooks stay co-located with their component, not in shared
  `utils/hooks/`
