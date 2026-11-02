import { TEST_NS } from '../utils/const/base';

const K8S_API = '/api/kubernetes';

export type NMStateReadiness = 'absent' | 'installed' | 'unreadable';
type SeedResult = 'created' | 'exists' | 'failed';

// Unique per run: concurrent runs against one shared cluster must never adopt or delete each
// other's objects, and must never collide on a physical network name.
const RUN_ID = Cypress.env('RUN_ID') || String(Date.now());

// `--env X=true` arrives as a boolean while an OS variable arrives as a string, so compare text.
const isEnabled = (name: string): boolean => String(Cypress.env(name)) === 'true';

export const LOCALNET_NAD_NAME = `network-localnet-e2e-${RUN_ID}`;
export const PHYSICAL_NETWORK_NAME = `e2e-phys-${RUN_ID}`;
export const SEEDED_POLICY_NAME = `e2e-physical-networks-${RUN_ID}`;
const SEEDED_NODE_SELECTOR_KEY = 'e2e.physical-networks/invalid-node';
// Gates only the cluster-scoped NNCP write; the namespaced NAD seed always runs.
export const CLUSTER_WRITES_ALLOWED = isEnabled('ALLOW_CLUSTER_WRITES');
// The plugin decides NMState presence from statically declared models, so no API response can make
// it report "absent"; it reads window.__NMSTATE_SIMULATED_ABSENT__ before its first render instead.
export const NMSTATE_SIMULATED_ABSENT = isEnabled('SIMULATE_NMSTATE_ABSENT');

export const simulateNMStateAbsent = (win: Window): void => {
  (win as { __NMSTATE_SIMULATED_ABSENT__?: boolean } & Window).__NMSTATE_SIMULATED_ABSENT__ = true;
};

// Cluster-scoped seeds carry this label so ci-scripts/test-cleanup.sh:22 and cleanup.sh:20 can sweep
// them when a run is interrupted; the value must stay identical to the selector in both scripts.
const MANAGED_BY_LABEL_KEY = 'app.kubernetes.io/managed-by';
const MANAGED_BY_LABEL_VALUE = 'networking-console-plugin-test';

const NAD_COLLECTION = `${K8S_API}/apis/k8s.cni.cncf.io/v1/namespaces/${TEST_NS}/network-attachment-definitions`;
const NNCP_COLLECTION = `${K8S_API}/apis/nmstate.io/v1/nodenetworkconfigurationpolicies`;

const csrfHeaders = (): Cypress.Chainable<Record<string, string>> =>
  cy
    .getCookie('csrf-token')
    .then((cookie) => (cookie ? { 'X-CSRFToken': cookie.value } : ({} as Record<string, string>)));

export const getNMStateReadiness = (): Cypress.Chainable<NMStateReadiness> =>
  cy.request({ failOnStatusCode: false, url: `${NNCP_COLLECTION}?limit=1` }).then(({ status }) => {
    if (status === 200) return 'installed';
    return status === 404 ? 'absent' : 'unreadable';
  });

const seed = (url: string, body: object): Cypress.Chainable<SeedResult> =>
  csrfHeaders().then((headers) =>
    cy
      .request({ body, failOnStatusCode: false, headers, method: 'POST', url })
      .then(({ status }) => {
        let result: SeedResult = 'failed';
        if (status === 409) result = 'exists';
        else if (status >= 200 && status < 300) result = 'created';
        // cy.log queues a command, so this callback must yield a chainable, not a bare value.
        return cy.log(`POST ${url} -> ${status} (${result})`).then(() => result);
      }),
  );

export const anyNodeMatchesSeededSelector = (): Cypress.Chainable<boolean> =>
  cy
    .request({
      failOnStatusCode: false,
      url: `${K8S_API}/api/v1/nodes?limit=1&labelSelector=${encodeURIComponent(
        `${SEEDED_NODE_SELECTOR_KEY}=never`,
      )}`,
    })
    .then(({ body, status }) => {
      if (status !== 200) {
        throw new Error(
          `Cannot verify the seeded node selector: the node list request returned ${status}.`,
        );
      }
      return (body?.items?.length ?? 0) > 0;
    });

export const createLocalnetNAD = (): Cypress.Chainable<SeedResult> =>
  seed(NAD_COLLECTION, {
    apiVersion: 'k8s.cni.cncf.io/v1',
    kind: 'NetworkAttachmentDefinition',
    metadata: {
      annotations: { description: 'e2e physical network nad' },
      name: LOCALNET_NAD_NAME,
      namespace: TEST_NS,
    },
    spec: {
      config: JSON.stringify({
        cniVersion: '0.3.1',
        mtu: 1500,
        name: LOCALNET_NAD_NAME,
        physicalNetworkName: PHYSICAL_NETWORK_NAME,
        topology: 'localnet',
        type: 'ovn-k8s-cni-overlay',
        vlanID: 400,
      }),
    },
  });

export const createSeededPolicy = (): Cypress.Chainable<SeedResult> =>
  seed(NNCP_COLLECTION, {
    apiVersion: 'nmstate.io/v1',
    kind: 'NodeNetworkConfigurationPolicy',
    metadata: {
      annotations: { description: 'e2e physical network policy' },
      labels: { [MANAGED_BY_LABEL_KEY]: MANAGED_BY_LABEL_VALUE },
      name: SEEDED_POLICY_NAME,
    },
    spec: {
      desiredState: {
        interfaces: [
          { bridge: { port: [{ name: 'eth0' }] }, name: 'br1', state: 'UP', type: 'ovs-bridge' },
          { mtu: 1500, name: 'br1', state: 'UP', type: 'ovs-interface' },
        ],
        ovn: { 'bridge-mappings': [{ bridge: 'br-ex', localnet: PHYSICAL_NETWORK_NAME }] },
      },
      nodeSelector: { [SEEDED_NODE_SELECTOR_KEY]: 'never' },
    },
  });

const deleteByUrl = (url: string): Cypress.Chainable<boolean> =>
  csrfHeaders().then((headers) =>
    cy
      .request({ failOnStatusCode: false, headers, method: 'DELETE', url })
      .then(({ status }) => status < 300 || status === 404),
  );

export const deleteLocalnetNAD = (): Cypress.Chainable<boolean> =>
  deleteByUrl(`${NAD_COLLECTION}/${LOCALNET_NAD_NAME}`);

export const deleteSeededPolicy = (): Cypress.Chainable<boolean> =>
  deleteByUrl(`${NNCP_COLLECTION}/${SEEDED_POLICY_NAME}`);
