import { checkErrors } from '../support';
import { MINUTE } from '../support/commands';

const TEST_NS = `eph-health-${Date.now()}`;
const FIXTURE = 'fixtures/endpoint-health.yaml';

const visitServices = () => {
  cy.visit(`/k8s/ns/${TEST_NS}/services`);
  cy.contains('h1', 'Services', { timeout: MINUTE }).should('be.visible');
  cy.contains('th', 'Health', { timeout: MINUTE }).should('exist');
};

const visitRoutes = () => {
  cy.visit(`/k8s/ns/${TEST_NS}/routes`);
  cy.contains('h1', 'Routes', { timeout: MINUTE }).should('be.visible');
  cy.contains('th', 'Backend health', { timeout: MINUTE }).should('exist');
};

const waitForHealthyService = () => {
  cy.exec(`oc wait --for=condition=available deployment/eph-healthy -n ${TEST_NS} --timeout=180s`, {
    failOnNonZeroExit: false,
    timeout: 3 * MINUTE,
  }).then((result) => {
    const code = result.code ?? 0;
    expect(code, 'wait for deployment failed').to.eq(0);
  });

  // EndpointSlice for the selector-based Service may lag the Deployment Available condition.
  cy.exec(
    `oc wait endpointslices -n ${TEST_NS} -l kubernetes.io/service-name=eph-healthy --for=jsonpath='{.endpoints[0].conditions.ready}'=true --timeout=120s`,
    { failOnNonZeroExit: false, timeout: 2 * MINUTE },
  ).then((result) => {
    const code = result.code ?? 0;
    expect(code, 'wait for EndpointSlice failed').to.eq(0);
  });
};

describe('OCPNETUI-59: Service and Route endpoint health', () => {
  before(() => {
    cy.login();
    cy.ensureNamespace(TEST_NS);
    cy.applyFixture(FIXTURE, TEST_NS);
    waitForHealthyService();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteNamespace(TEST_NS);
    cy.logout();
  });

  it('shows Healthy with ready/total for a Service backed by ready pods', () => {
    visitServices();
    cy.filterByName('eph-healthy');
    cy.assertEndpointHealth('eph-healthy', 'Healthy', 1, 1);
  });

  it('shows Degraded with partial ready/total from EndpointSlice fixture', () => {
    visitServices();
    cy.filterByName('eph-degraded');
    cy.assertEndpointHealth('eph-degraded', 'Degraded', 1, 2);
  });

  it('shows Down as 0/N when no endpoints are ready', () => {
    visitServices();
    cy.filterByName('eph-down');
    cy.assertEndpointHealth('eph-down', 'Down', 0, 2);
  });

  it('shows Unknown for ExternalName Services', () => {
    visitServices();
    cy.filterByName('eph-external');
    cy.assertEndpointHealth('eph-external', 'Unknown');
  });

  it('shows matching Backend health on the Routes list', () => {
    visitRoutes();
    cy.filterByName('eph-healthy');
    cy.assertEndpointHealth('eph-healthy', 'Healthy', 1, 1);
  });
});
