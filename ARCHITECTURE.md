# Architecture — Networking Console Plugin

## System Context

This plugin extends the OpenShift Console to provide the Networking section UI. It runs as a separate webpack bundle
loaded at runtime via [module federation](https://webpack.js.org/concepts/module-federation/). The console discovers and
loads the plugin through a `ConsolePlugin` custom resource registered on the cluster.

```text
+-------------------+       module federation       +----------------------------+
|  OpenShift        | <---------------------------> | networking-console-plugin  |
|  Console          |   (runtime, port 9001 dev)    | (webpack dev server / nginx)|
|  (host app)       |                               +----------------------------+
+-------------------+                                          |
        |                                                      |
        v                                                      v
+-------------------+                               +----------------------------+
| Kubernetes API    | <------ K8s SDK hooks ------> | Console Plugin SDK         |
| Server            |   useK8sWatchResource         | @openshift-console/        |
+-------------------+   k8sCreate / k8sPatch        |   dynamic-plugin-sdk       |
                        k8sDelete                    +----------------------------+
```

The plugin has no backend server of its own. All data flows through the OpenShift Console's Kubernetes API proxy using
the Console Plugin SDK.

## Plugin Registration

The plugin registers itself with the console via `plugin-manifest.ts`, which aggregates extensions from each view's
`manifest.ts`:

```text
plugin-manifest.ts
  |-- src/views/ingresses/manifest.ts
  |-- src/views/nads/manifest.ts
  |-- src/views/networkpolicies/manifest.ts
  |-- src/views/routes/manifest.ts
  |-- src/views/services/manifest.ts
  |-- src/views/udns/manifest.ts
  |-- src/utils/flags/manifest.ts
  |-- src/templates/index.ts
```

Each manifest declares:

- **Extension types**: typed `EncodedExtension` objects that register console navigation items, resource list/detail
  pages, YAML templates, and route pages,
  `console.resource/details-item`, `console.yaml-template`, `console.action/resource-provider`
- **Exposed modules**: React components and hooks that the console lazy-loads via `$codeRef`

## Networking Resources

The plugin manages these Kubernetes resource kinds:

| Resource                    | API Group                 | View Path                    |
|-----------------------------|---------------------------|------------------------------|
| Service                     | `v1` (core)               | `src/views/services/`        |
| Route                       | `route.openshift.io/v1`   | `src/views/routes/`          |
| Ingress                     | `networking.k8s.io/v1`    | `src/views/ingresses/`       |
| NetworkPolicy               | `networking.k8s.io/v1`    | `src/views/networkpolicies/` |
| MultiNetworkPolicy          | `k8s.cni.cncf.io/v1beta1` | `src/views/networkpolicies/` |
| NetworkAttachmentDefinition | `k8s.cni.cncf.io/v1`      | `src/views/nads/`            |
| UserDefinedNetwork          | `k8s.ovn.org/v1`          | `src/views/udns/`            |
| ClusterUserDefinedNetwork   | `k8s.ovn.org/v1`          | `src/views/udns/`            |

Feature flags gate CRD-dependent views. NAD views require `NET_ATTACH_DEF` and `KUBEVIRT_DYNAMIC`. UDN views require
`FLAG_UDN_ENABLED`. Flags are detected at runtime by probing for CRD existence.

## Data Flow

```text
User action (list / detail / create / edit / delete)
  |
  v
React Component (view layer)
  |-- useK8sWatchResource()  -->  K8s API (via console proxy)  -->  resource list / watch
  |-- k8sCreate()            -->  K8s API                      -->  POST resource
  |-- k8sPatch()             -->  K8s API                      -->  PATCH resource
  |-- k8sDelete()            -->  K8s API                      -->  DELETE resource
  |
  v
VirtualizedTable / DetailPage / Form  (PatternFly components)
  |
  v
logNetworkingEvent()  -->  Segment analytics (telemetry)
```

All resource operations go through the Console Plugin SDK, which proxies requests through the console backend to the
Kubernetes API server. The plugin does not make direct API calls.

## Build and Deployment

### Development

- `webpack.config.ts` configures `esbuild-loader` for TypeScript/JSX transpilation and `ConsoleRemotePlugin` for module
  federation.
- Dev server runs on port 9001 with HMR, CORS headers, and `writeToDisk` enabled.
- `start-console.sh` launches an OpenShift console container pointing at the dev server and optionally other plugin dev
  servers.

### Production

- `npm run build` produces optimized bundles in `dist/` with content hashes.
- `Dockerfile` builds using the `rhel-9-base-nodejs-openshift-4.22` builder image, then serves static files via nginx.
- `Dockerfile.art` is the ART (Automated Release Tooling) variant used by Red Hat build systems.

### Cluster Deployment

- A Helm chart in `charts/openshift-console-plugin/` deploys the plugin as an nginx pod with a `ConsolePlugin` CR.
- The chart supports security context, pod security, resource limits, and a patcher job that registers the plugin with
  the console operator.

## CI/CD

The project uses Prow and CI Operator (`.ci-operator.yaml`):

- **test-frontend.sh** — validates that i18n locale files are up to date
- **test-prow-e2e.sh** — runs headless Cypress tests against a live OpenShift cluster
- OWNERS-based review: reviewers apply `/lgtm`, approvers apply `/approve`, Prow merges

## Key Dependencies

| Package                                                | Purpose                                          |
|--------------------------------------------------------|--------------------------------------------------|
| `@openshift-console/dynamic-plugin-sdk`                | Console integration (hooks, CRUD, UI primitives) |
| `@openshift-console/dynamic-plugin-sdk-webpack`        | Webpack plugin for module federation             |
| `@kubevirt-ui/kubevirt-api`                            | KubeVirt type definitions and model utilities    |
| `@patternfly/react-core`, `react-table`, `react-icons` | UI component library                             |
| `react-hook-form`                                      | Form state management                            |
| `react-router` (v7)                                    | Client-side routing                              |
| `react-i18next`                                        | Internationalization                             |
| `esbuild-loader`                                       | Fast TypeScript/JSX transpilation                |
| `cypress`                                              | E2E testing                                      |
