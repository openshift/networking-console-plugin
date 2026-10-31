import { TEST_NS } from '../utils/const/base';

const K8S_API = '/api/kubernetes';

export type NMStateReadiness = 'absent' | 'installed' | 'unreadable';
export type SeedResult = 'created' | 'exists' | 'failed';

// Unique per run: concurrent runs against one shared cluster must never adopt or delete each
// other's objects, and must never collide on a physical network name.
const RUN_ID = Cypress.env('RUN_ID') || String(Date.now());

export const LOCALNET_NAD_NAME = `network-localnet-e2e-${RUN_ID}`;
export const PHYSICAL_NETWORK_NAME = `e2e-phys-${RUN_ID}`;
export const SEEDED_POLICY_NAME = `e2e-physical-networks-${RUN_ID}`;
export const SEEDED_NODE_SELECTOR_KEY = 'e2e.physical-networks/invalid-node';
export const CLUSTER_WRITES_ALLOWED = Cypress.env('ALLOW_CLUSTER_WRITES') === 'true';

export const NAD_COLLECTION = `${K8S_API}/apis/k8s.cni.cncf.io/v1/namespaces/${TEST_NS}/network-attachment-definitions`;
export const NNCP_COLLECTION = `${K8S_API}/apis/nmstate.io/v1/nodenetworkconfigurationpolicies`;

export const csrfHeaders = (): Cypress.Chainable<Record<string, string>> =>
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
        if (status === 409) return 'exists';
        return status >= 200 && status < 300 ? 'created' : 'failed';
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
    .then(({ body, status }) => status === 200 && (body?.items?.length ?? 0) > 0);

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
