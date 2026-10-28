import { checkErrors } from '../support';
import { MINUTE } from '../support/commands';

const LIST_PAGES = [
  {
    h1: 'Ingresses',
    name: 'Ingresses',
    url: '/k8s/ns/default/networking.k8s.io~v1~Ingress',
  },
  {
    h1: 'NetworkAttachmentDefinitions',
    name: 'NetworkAttachmentDefinitions',
    url: '/k8s/ns/default/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition',
  },
  {
    h1: 'NetworkPolicies',
    name: 'NetworkPolicies',
    url: '/k8s/ns/default/networking.k8s.io~v1~NetworkPolicy',
  },
  {
    h1: 'Routes',
    name: 'Routes',
    url: '/k8s/ns/default/route.openshift.io~v1~Route',
  },
  {
    h1: 'Services',
    name: 'Services',
    url: '/k8s/ns/default/core~v1~Service',
  },
  {
    h1: 'UserDefinedNetworks',
    name: 'UserDefinedNetworks',
    url: '/k8s/ns/default/k8s.ovn.org~v1~UserDefinedNetwork',
  },
  {
    h1: 'BGP cloud configurations',
    name: 'BGPCloudConfigurations',
    url: '/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration',
  },
  {
    h1: 'BGP routings',
    name: 'BGPRoutings',
    url: '/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting',
  },
];

describe('List page smoke tests', { testIsolation: false }, () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  LIST_PAGES.forEach(({ h1, name, url }) => {
    it(`loads the ${name} list page`, () => {
      cy.visit(url);
      cy.dismissWelcomeTourIfPresent();
      cy.contains('h1', h1, { timeout: MINUTE }).should('be.visible');
    });
  });
});
