const wp = require('@cypress/webpack-preprocessor');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      module: {
        rules: [
          {
            exclude: /node_modules/,
            loader: 'esbuild-loader',
            test: /\.ts$/,
          },
        ],
      },
      resolve: {
        extensions: ['.ts', '.tsx', '.js'],
      },
    },
  };
  on('file:preprocessor', wp(options));

  let consoleErrorText = null;
  let screenshotIndex = 0;
  const errorDetailsDir = path.resolve(__dirname, '../gui-test-screenshots/error-details');

  const isConsoleErrorDetailsShot = (details) => {
    const name = String(details.name || '');
    const shotPath = String(details.path || '');
    return (
      name.includes('console-error-details') ||
      path.basename(shotPath).includes('console-error-details')
    );
  };

  on('task', {
    execOc({ args }) {
      try {
        return execSync(`oc ${args.join(' ')}`, { encoding: 'utf-8', timeout: 300000 });
      } catch {
        return null;
      }
    },
    // Fallback for BRIDGE_KUBEADMIN_PASSWORD when Cypress.env is empty
    // (e.g. allowCypressEnv:false or Jenkins injection race). Reads from
    // process.env first (Jenkins sets it), then from the cluster's
    // kubeadmin-password file on the agent's NFS mount.
    getKubeadminPassword() {
      if (process.env.BRIDGE_KUBEADMIN_PASSWORD) return process.env.BRIDGE_KUBEADMIN_PASSWORD;
      try {
        const base = process.env.BRIDGE_BASE_ADDRESS || '';
        const m = base.match(/console-openshift-console\.apps\.([^.]+)\.([^/]+)/);
        if (m) {
          const cluster = m[1];
          const p = path.resolve(
            process.env.HOME || '',
            `rhos-psi.cnv-qe.rhood.us/${cluster}/auth/kubeadmin-password`,
          );
          if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
        }
      } catch {
        // ignore
      }
      return null;
    },
    // Stashed by support/console-error-details.ts immediately before its screenshot.
    setConsoleErrorText(text) {
      consoleErrorText = typeof text === 'string' ? text : '';
      return null;
    },
  });
  // The prefixed png basename exists only after this rename. Write the matching
  // error-details txt here so its filename is that basename with .txt.
  on('after:screenshot', async (details) => {
    const prefix = String(screenshotIndex).padStart(3, '0');
    screenshotIndex += 1;
    const renamed = path.join(
      path.dirname(details.path),
      `${prefix}.${path.basename(details.path)}`,
    );
    const text = isConsoleErrorDetailsShot(details) ? consoleErrorText : null;
    if (isConsoleErrorDetailsShot(details)) {
      consoleErrorText = null;
    }

    await fs.promises.rename(details.path, renamed);

    if (text !== null) {
      const txtPath = path.join(errorDetailsDir, `${path.parse(renamed).name}.txt`);
      await fs.promises.mkdir(errorDetailsDir, { recursive: true });
      await fs.promises.writeFile(txtPath, text, 'utf8');
    }

    return { path: renamed };
  });

  config.baseUrl = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000/'}`;

  // Test namespaces must match what setup.sh/cleanup.sh create. Taking them
  // from the ambient process.env meant the CI agent image leaked an old
  // TEST_NS (ingress-test, which does not exist) and every list page rendered
  // its empty state instead of the resource table. Overrides are explicit and
  // prefixed: CYPRESS_TEST_NS=... .
  const DEFAULTS = {
    CUDN_NS: 'cudn-test-ns',
    EMPTY_NS: 'empty-test-ns',
    LOCALNET_NS: 'localnet-test-ns',
    NAD_NS: 'nad-test-ns',
    TEST_NS: 'cy-test-ns',
    TOPO_NS: 'topo-test-ns',
    UDN_NS: 'udn-test-ns',
  };
  const ns = (name) => process.env[`CYPRESS_${name}`] ?? config.expose?.[name] ?? DEFAULTS[name];

  // Public configuration: exposed to browser code via Cypress.expose().
  // The NAD form validates the physical network name against the cluster's
  // OVN bridge mappings, so a secondary-localnet NAD cannot be created when
  // none are configured. Probe once here so specs can skip deterministically.
  let hasOvnBridgeMappings = false;
  try {
    const ovnkubeConf = execSync('oc get cm ovnkube-config -n openshift-ovn-kubernetes -o yaml', {
      encoding: 'utf-8',
      timeout: 30000,
    });
    hasOvnBridgeMappings = /bridge-mappings\s*=\s*\S+/.test(ovnkubeConf);
  } catch {
    // oc unavailable or cluster unreachable — treat as absent
  }

  const exposed = {
    ALLOW_CLUSTER_WRITES: process.env.ALLOW_CLUSTER_WRITES ?? config.env?.ALLOW_CLUSTER_WRITES,
    HIDE_XHR: process.env.HIDE_XHR ?? config.env?.HIDE_XHR,
    NON_PRIV: process.env.NON_PRIV ?? config.env?.NON_PRIV,
    OVN_HAS_BRIDGE_MAPPINGS: String(hasOvnBridgeMappings),
    RUN_ID: process.env.RUN_ID ?? config.env?.RUN_ID,
    SIMULATE_NMSTATE_ABSENT:
      process.env.SIMULATE_NMSTATE_ABSENT ?? config.env?.SIMULATE_NMSTATE_ABSENT,
  };
  Object.keys(DEFAULTS).forEach((name) => {
    exposed[name] = ns(name);
  });
  // Drop unset keys: cypress rejects undefined expose values.
  config.expose = Object.fromEntries(
    Object.entries(exposed).filter(([, value]) => value !== undefined),
  );

  // Sensitive: readable from test code via cy.env() only.
  const kubeadminPassword =
    process.env.BRIDGE_KUBEADMIN_PASSWORD ?? config.env?.BRIDGE_KUBEADMIN_PASSWORD;
  config.env = kubeadminPassword ? { BRIDGE_KUBEADMIN_PASSWORD: kubeadminPassword } : {};
  return config;
};
