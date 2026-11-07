# E2E coverage inventory and integration-test candidates

Snapshot of the end-to-end coverage in `networking-console-plugin` and `kubevirt-ui`,
taken by reading every spec file in both repositories, and the reasoning used to pick
which scenarios deserve deterministic integration tests with mocked backend responses.

## networking-console-plugin

Two Cypress suites exist. They share almost no coverage.

### `ui-tests-cy` — 18 spec files, 61 tests

Used by the hot-cluster workflows (`hot-cluster-e2e-run.yml`, and `e2e.yml` after the
runner fix). Specs run against a live cluster console; `all.cy.ts` is an aggregate that
imports the other 17 so a single `--spec` covers everything in order.

| Spec                                  | Flow                                                         | Cluster data                                |
| ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| `setup/login.cy.ts`                   | OAuth login to the console                                   | none                                        |
| `setup/visit-pages.cy.ts`             | Sidebar navigation to 5 networking list pages                | UDN, Service, Route, Ingress, NetworkPolicy |
| `networking/udn.cy.ts`                | Create UDN, create and delete CUDN                           | UDN, CUDN                                   |
| `networking/nad-bridge.cy.ts`         | Create linux-bridge NAD with MAC spoof and VLAN              | NAD                                         |
| `networking/nad-localnet.cy.ts`       | Create and delete secondary-localnet NAD                     | NAD, NNCP (bridge mapping)                  |
| `networking/nad-ovn.cy.ts`            | Create L2-overlay NAD                                        | NAD                                         |
| `networking/physical-networks.cy.ts`  | Physical networks page: localnet refs, NMState state merge   | NAD, NNCP, Node                             |
| `networking/services.cy.ts`           | Create Service through the YAML editor                       | Service                                     |
| `networking/routes.cy.ts`             | Create Route via the form against a seeded Service           | Route, Service                              |
| `networking/ingresses.cy.ts`          | Create Ingress through the YAML editor                       | Ingress                                     |
| `networking/net-policies.cy.ts`       | Create a deny-ingress NetworkPolicy via the form             | NetworkPolicy                               |
| `networking/topology-toolbar.cy.ts`   | Filter, search, advanced filter, display options, table view | **external prototype site**                 |
| `networking/topology-node-view.cy.ts` | Node underlay view, worker add/remove, legend                | **external prototype site**                 |
| `networking/topology-drawer.cy.ts`    | Resource drawer tabs, actions, failure alerts                | **external prototype site**                 |
| `networking/topology-views.cy.ts`     | Owner / Namespace / Network / Resource view switching        | **external prototype site**                 |
| `networking/topology-cudn-udn.cy.ts`  | OCPNETUI-18: CUDN/UDN nodes, edges, selection                | Namespaces, 4 CUDNs, UDN, NADs              |
| `networking/topology-nads.cy.ts`      | OCPNETUI-31: NAD node types, edges, resource filter          | Namespaces, CUDNs, UDN, NADs                |

Four topology specs (`toolbar`, `node-view`, `drawer`, `views`) point at
`https://openshift-platform-prototype.vercel.app/networking/topology` and never load the
plugin, so they exercise a prototype, not this codebase.

Several specs depend on state seeded outside the spec: `cy-test-ns` / `udn-test-ns` are
created by `.github/actions/setup-test-namespaces/action.yml`, NAD specs `oc delete`
leftovers first, physical-networks seeds an NNCP only under `ALLOW_CLUSTER_WRITES`, and the
two topology specs apply YAML fixtures and poll the cluster for managed NADs.

### `integration-tests` — 4 spec files, 35 tests

Legacy Prow suite. Every spec is cluster-backed.

| Spec                            | Flow                                                             | Cluster data                                     |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| `list-pages.cy.ts`              | Smoke-load 6 networking list pages in `default`                  | Ingress, NAD, NetworkPolicy, Route, Service, UDN |
| `service-form.cy.ts`            | Service form: 4 types, ports, selectors, YAML sync, edit, delete | Service                                          |
| `network-vm-navigation.cy.ts`   | OCPNETUI-14: UDN/CUDN/NAD VM tab, navigation, paging             | Namespace, NAD, UDN, CUDN, VirtualMachine        |
| `service-endpoint-health.cy.ts` | OCPNETUI-59: Healthy / Degraded / Down / Unknown columns         | Namespace, Deployment, Service, EndpointSlice    |

### Shape of the coverage

- The browser suites are heavy on _transactions_ (create this object, see it appear) and
  thin on _derivation_: health states, source-state alerts, graph node/edge construction,
  and form validation are only ever observed indirectly, after a live cluster has
  converged.
- The Jest integration suite closes that gap through click-driven flows: it renders the
  production page against recorded responses, exercises the filter, row, tab, menu, form
  and drawer interactions a user performs, and asserts the resulting UI or request.
- The three topology pure-function suites (`filterModel`, topology table utils,
  visualization utils) remain under `npm test`. They are unit tests, not integration
  coverage, and the integration runner does not count them.
- The most fragile browser specs are the ones whose assertions depend on cluster
  convergence: `service-endpoint-health` waits for a Deployment and its EndpointSlice;
  the topology specs poll for managed NADs; `physical-networks` needs NMState plus a gated
  NNCP write; `nad-localnet` needs a bridge mapping that exists only when the suite seeds
  one.

## kubevirt-ui

Playwright only — no Cypress, no Jest, no Testing Library. 97 spec files:

| Directory                                                   | Specs             | Nature                                                                                                                          |
| ----------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `api/`                                                      | 17                | REST-level contract tests (VM CRUD, snapshots, migrations, templates, folders, bootable volumes, instance types, non-priv RBAC) |
| `fleet-virtualization-acm/`                                 | 20                | ACM fleet perspective: filtering by cluster/project, catalog, navigation                                                        |
| `tier1/`, `tier2/`                                          | 13 + 9            | UI flows grouped by priority tier                                                                                               |
| `visual/`                                                   | 9                 | visual regression                                                                                                               |
| `gating/`, `nonpriv/`, `migrations/`, `settings/`, `s390x/` | 6 + 5 + 2 + 3 + 4 | release gating, RBAC rejection, migrations, settings, architecture-specific                                                     |

Their `api/` group is the closest analogue to what this document proposes: it asserts
backend contracts directly instead of driving them through the UI, which is why it is
fast and stable. It still runs against a live cluster, so it needs a provisioned
environment and real objects.

## Where integration tests add the most value

Criteria used, in order:

1. The behaviour is derived from backend data (mapping, aggregation, validation) rather
   than being a pure click-through, so a recorded response can pin it down.
2. The e2e test that covers it today is slow, gated, or convergence-dependent.
3. The code seam already exists and is importable without the console runtime.

| Scenario                       | Seam                                                            | Today's e2e cost                                                   | Why it is worth pinning                                                                                          |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Service endpoint health        | `useEndpointHealth` + `aggregateEndpointSliceHealth`            | Needs a live Deployment whose EndpointSlice reaches Ready          | Four-state aggregation drives the service list status column; a wrong rule is invisible until a cluster degrades |
| OVN bridge mappings            | `useOVNBridgeMappings` + `getObservedBridgeMappings`            | Needs NMState and a gated NNCP write                               | Decides whether the localnet NAD form can be submitted at all                                                    |
| Physical network source states | `physical-networks/utils/sourceStates.ts` + `SourceStateAlerts` | Needs NMState install state and policy merge                       | Alert severity is derived from several object states; e2e only asserts the merged row                            |
| CUDN/UDN topology graph        | `topology/utils/dataTransformation` + factories                 | Applies 4 CUDNs, a UDN and namespaces, then polls for managed NADs | Node/edge construction from CUDN, UDN and NAD listings is pure mapping over API objects                          |
| Service list health join       | `useServiceListViewData`                                        | Same live Deployment as endpoint health, plus the list render      | The list column is where operators read health; a broken join hides the status entirely                          |

## Integration suite: click-driven user flows

The Jest integration runner exists to cover user flows that the cluster-backed Cypress
suites cannot run deterministically. Every test under `src/**/*.integration.test.tsx`
renders a production page or component and drives it with `@testing-library/user-event`:
typing in the list filter, clicking a row, opening a dropdown, selecting a tab, expanding a
table row, submitting a form, and then observing the visible result or the request the UI
sent. There are no pure-function, hook-probe or render-only tests under the integration
match; those were removed so the suite cannot substitute unit assertions for a user flow.

16 suites / 37 tests:

| Suite                    | Tests | User flow                                                                                                                                 |
| ------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Service list             | 5     | Filter the list, open a Service, open the create form; Healthy/Degraded/Down/Unknown health and every location variant from the list rows |
| Service form             | 3     | Type a name, submit Create; submit Save on an existing Service; clear a required field and observe the disabled submit                    |
| Service details Pods tab | 2     | Open the details page, click the Pods tab, filter the selector-scoped pods, open a Pod                                                    |
| Route list               | 2     | Filter, read status, location, backend and health from the rows, open a Route, and open the create form                                   |
| Route form               | 1     | Pick a service and target port, type a host, submit Create and assert the posted Route                                                    |
| Ingress list             | 4     | Filter, open an Ingress, open the create page, read the joined hosts, and open Edit Ingress on the canonical YAML route                   |
| NetworkPolicy list       | 2     | Filter, open a policy, and observe the empty paginated table                                                                              |
| NetworkPolicy page       | 1     | Click the MultiNetworkPolicies tab, click Enable, and assert the cluster-network patch                                                    |
| NAD list                 | 4     | Filter, open a network, open the create form, open the action menu for a plain and a UDN-managed network                                  |
| NAD form                 | 3     | Select a network type, fill the bridge or localnet fields, submit; leave a required field empty and observe the disabled submit           |
| NAD details VM tab       | 2     | Open the details page, click the Virtual Machines tab, filter the attached VMs, and open the Add virtual machines dialog                  |
| UDN list                 | 2     | Filter, open a network, and open the create choices                                                                                       |
| UDN form                 | 2     | Type a name and submit a namespaced UDN; type a name and submit a CUDN with its namespace selector                                        |
| Physical networks page   | 2     | Filter the inventory, expand a network row, read its observed mappings, and open a node                                                   |
| Create project modal     | 1     | Fill the project name, switch to the Network tab, select a CUDN, submit, and assert the project request and CUDN patch                    |
| Topology toolbar         | 1     | Open the resource filter, read the counts from the mocked model, click a type, and assert the URL                                         |

Every non-empty GET response comes from a recording: `services`, `endpointslices`, `pods`,
`ingresses`, `routes`, `networkpolicies`, `multinetworkpolicies`,
`networkattachmentdefinitions`, `userdefinednetworks`, `clusteruserdefinednetworks`,
`nodenetworkstates`, `nodenetworkconfigurationpolicies`,
`nodenetworkconfigurationenactments`, `nodes`, `networkconfig`, `consolequickstarts`,
`virtualmachines`, `virtualmachineinstances` and the two instancetype lists. The only
literal responses left are the empty-list cases used to exercise empty states and the
POST/PATCH handlers that assert the request the UI produces. The expectations are observed
through the UI: the rows, labels, empty states, action-menu disabled states and navigation
targets a user would see.

## How the integration tests are built

- Runner: `jest.integration.config.ts` (`npm run test:integration`), separate from the
  unit config so `npm test` stays fast. It renders real pages and components; the console
  SDK is replaced by `src/test/console-sdk-shim.tsx`, which implements the data hooks and
  navigation primitives over `fetch`, so MSW intercepts exactly what production reads.
  The Test workflow runs `npm run test:coverage` for the unit suites, which ignores
  `*.integration.test.*`, and then an `Integration tests` step that runs
  `npm run test:integration -- --runInBand`; both are CI gates. The suite needs no
  cluster at test time because every response is a recording.
- Responses: `scripts/seed-integration-fixtures.sh` creates the objects a capture needs,
  `scripts/record-integration-fixtures.sh` records the live payloads with `oc get --raw`,
  and `scripts/sanitize-fixture.js` strips server bookkeeping, node names, addresses and
  cluster identifiers before anything is written. The MSW server has no default
  handlers: every request must be answered by the scenario, and one that reaches it
  unhandled is recorded, aborted before it can reach the network, and fails the test
  that issued it. Console output is captured the same way and asserted empty, so a
  React or PatternFly warning fails its test even though jest's non-verbose reporter
  never prints it in CI.
- Navigation: the shim's `ResourceLink`, `HorizontalNav`, `ListPageCreateButton`,
  `ListPageCreateDropdown` and `useListPageFilter` mirror the console contracts, and tests
  assert the pathname a click produced. Route-specific assertions use a `LocationProbe`
  rendered beside the page under test.
- Provenance: the JSON in `src/test/fixtures` is a capture from a live cluster. The
  recorder seeds `cy-test-ns` with fixed pods (`web-1`, `web-2`, `other-1`), Services for
  the cluster-IP/headless/NodePort/LoadBalancer/ExternalName locations, manually managed
  EndpointSlices for the Healthy/Degraded/Down states, bridge NADs, two Layer2 UDNs, a
  CUDN, two Ingresses, two Routes, two NetworkPolicies and four stopped VirtualMachines,
  then runs `NS=cy-test-ns ./scripts/record-integration-fixtures.sh` and
  `./scripts/seed-integration-fixtures.sh --cleanup`. Recording is read-only; the seed
  and cleanup are the only cluster writes. The included
  `clusteruserdefinednetworks.json` predates the seed's namespace-name selector and still
  records `team: blue`; it remains a historical capture, and the next recording refreshes
  it to `kubernetes.io/metadata.name: cy-test-ns`. The scrubber refuses `Secret` payloads, any
  namespace outside the two the suite owns, and every node name, API host and cluster label
  reported to it; it substitutes them inside composite strings such as interface names and
  re-scans its own output. Pod bodies are projected to identity, labels, the network
  annotation, readiness and node name, `NodeNetworkState` bodies to OVN bridge mappings,
  and Node, QuickStart and instancetype lists to the fields the UI reads, so container
  runtime IDs, kubelet and tutorial documents never reach the repository.
