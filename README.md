# Networking Console Plugin

An OpenShift Console dynamic plugin that provides the Networking section UI for the OpenShift web console. It manages
views for Services, Routes, Ingresses, NetworkPolicies, NetworkAttachmentDefinitions (NADs), and UserDefinedNetworks (
UDNs).

The plugin integrates with the [OpenShift Console](https://github.com/openshift/console)
via [webpack module federation](https://webpack.js.org/concepts/module-federation/) and
the [Console Plugin SDK](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk).
It registers as a `ConsolePlugin` custom resource and is enabled by a cluster administrator through the console operator
config.

## Prerequisites

- [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)
- [oc](https://console.redhat.com/openshift/downloads) CLI, logged into an OpenShift cluster
- [Docker](https://www.docker.com) or [podman 3.2.0+](https://podman.io) (for running the console locally)

## Quick Start

In one terminal, start the plugin dev server:

```bash
npm install
npm run start
```

In another terminal, start the OpenShift console container:

```bash
oc login  # ensure you're authenticated to a cluster
npm run start-console
```

Navigate to `http://localhost:9000`. The plugin dev server runs on port 9001 with CORS enabled and hot module
replacement.

The `start-console` script supports running companion plugins alongside this one. Pass plugin names as arguments:

```bash
npm run start-console -- monitoring-plugin nmstate-console-plugin
```

### Apple Silicon + Podman

If `npm run start-console` fails on Apple silicon, install QEMU user-static support:

```bash
podman machine ssh
sudo -i
rpm-ostree install qemu-user-static
systemctl reboot
```

### VS Code Dev Container

An alternative setup uses Docker Compose with
the [Remote Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
extension:

1. Create `.devcontainer/dev.env`:

```bash
OC_PLUGIN_NAME=networking-console-plugin
OC_URL=https://api.example.com:6443
OC_USER=kubeadmin
OC_PASS=<password>
```

2. Open the folder in a dev container: `Ctrl+Shift+P` > `Remote Containers: Open Folder in Container...`
3. Run `npm run start`

## Development

### Scripts

| Command                         | Description                                                       |
|---------------------------------|-------------------------------------------------------------------|
| `npm run start`                 | Start webpack dev server on port 9001                             |
| `npm run start-console`         | Launch OpenShift console in a container connected to your cluster |
| `npm run build`                 | Production build to `dist/`                                       |
| `npm run build-dev`             | Development build to `dist/`                                      |
| `npm run dev`                   | Dev build with increased memory (8 GB)                            |
| `npm run lint`                  | Run ESLint on `src/` and `integration-tests/`                     |
| `npm run lint-fix`              | Auto-fix lint issues                                              |
| `npm run i18n`                  | Extract and update translation strings in `locales/`              |
| `npm run test-cypress`          | Open Cypress test runner (interactive)                            |
| `npm run test-cypress-headless` | Run Cypress tests headless                                        |

### Path Aliases

The project uses TypeScript path aliases configured in `tsconfig.json`:

| Alias       | Target         |
|-------------|----------------|
| `@utils/*`  | `src/utils/*`  |
| `@views/*`  | `src/views/*`  |
| `@styles/*` | `src/styles/*` |

### Linting

ESLint is configured with `plugin:react/recommended`, `plugin:@typescript-eslint/recommended`, Prettier integration, and
`eslint-plugin-perfectionist` for alphabetical ordering. Import ordering uses `simple-import-sort` with groups: Node
builtins, then packages (React first), then internal (`@`-prefixed), then relative imports, then styles.

Key rules:

- `no-console: "error"` — use the `networkConsole` helper instead of `console.*`
- `no-nested-ternary: "error"`
- `@typescript-eslint/no-unused-vars` with `varsIgnorePattern: "^_"`
- `@typescript-eslint/no-shadow: "error"`

Prettier config: single quotes, trailing commas, 100-char print width, 2-space tabs.

### Internationalization

The i18n namespace is `plugin__networking-console-plugin`. Use the `useNetworkingTranslation` hook:

```tsx
import {useNetworkingTranslation} from '@utils/hooks/useNetworkingTranslation';

const MyComponent: FC = () => {
  const {t} = useNetworkingTranslation();
  return <h1>{t('Hello, World!')}</h1>;
};
```

For non-component contexts, it is possible to use the standalone `t` function from the same module, but to ensure that
strings update properly when the language is changed create a function in the non-component file that accepts an
argument named 't' of type TFunction and use it to translate the file. The `Trans` component from `react-i18next` is
used for translations containing JSX.

Supported locales: `en`, `es`, `fr`, `ja`, `ko`, `zh`. Run `npm run i18n` after changing translatable strings, then
commit the updated `locales/` files.

### Styling

- Use PatternFly global CSS variables for colors (no hex colors — required for dark mode support)
- Prefix CSS classnames with the plugin name to avoid collisions with console styles
- Do not use `.pf-` or `.co-` prefixed selectors or naked element selectors (`table`, `div`)
- SCSS files are co-located with their components

## Docker Image

Build and push the plugin image:

```bash
docker build -t quay.io/my-repository/networking-console-plugin:latest .
docker push quay.io/my-repository/networking-console-plugin:latest
```

On Apple silicon, add `--platform=linux/amd64`.

## Deployment

A [Helm chart](charts/openshift-console-plugin/) deploys the plugin to OpenShift:

```bash
helm upgrade -i networking-console-plugin charts/openshift-console-plugin \
  -n plugin__networking-console-plugin --create-namespace \
  --set plugin.image=<image-location>
```

See `charts/openshift-console-plugin/values.yaml` for all parameters.

## Testing

### Frontend Validation

The `test-frontend.sh` script runs `npm run i18n` and checks that locale files are up to date. This runs in Prow CI.

### Cypress E2E Tests

Tests live in `integration-tests/tests/`. Run interactively with `npm run test-cypress` or headless with
`npm run test-cypress-headless`. The Prow e2e job (`test-prow-e2e.sh`) runs headless Cypress against a live cluster.

Generate HTML test reports:

```bash
npm run cypress-merge
npm run cypress-generate
```

The report is written to `integration-tests/screenshots/cypress-report.html`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, PR process, and commit conventions.

## Learn More

| Reference                                                                       | Description                                                 |
|---------------------------------------------------------------------------------|-------------------------------------------------------------|
| [OpenShift web console](https://github.com/openshift/console)                   | Web-based user interface for OpenShift                      |
| [OpenShift Dynamic Plugin SDK](https://github.com/openshift/dynamic-plugin-sdk) | Dynamic plugin SDK for OpenShift user interfaces            |
| [PatternFly](https://www.patternfly.org/)                                       | Open-source design system used for OpenShift UI development |