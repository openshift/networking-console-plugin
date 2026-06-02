export const adminOnlyDescribe = Cypress.env('NON_PRIV') ? xdescribe : describe;
export const adminOnlyIT = Cypress.env('NON_PRIV') ? xit : it;

export const TEST_NS = Cypress.env('TEST_NS') || 'cy-test-ns';
export const UDN_NS = Cypress.env('UDN_NS') || 'udn-test-ns';

export const EXAMPLE = 'example';
export const ALL_PROJ_NS = 'All Projects';
export const TEST_ROUTE_NAME = 'auto-test-route';
export const TEST_POL_NAME = 'auto-test-net-policy';
export const TEST_MULTI_NAME = 'auto-test-multi-policy';

export const SECOND = 1000;
export const MINUTE = 60000;

export const UDN_LABEL = 'k8s.ovn.org/primary-user-defined-network';

export enum K8S_KIND {
  CUDN = 'ClusterUserDefinedNetwork',
  NAD = 'net-attach-def',
  Project = 'project',
  UDN = 'UserDefinedNetwork',
}
