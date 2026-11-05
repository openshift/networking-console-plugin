import { getPublicEnv } from '../../support/env';

export const adminOnlyDescribe = getPublicEnv('NON_PRIV') ? xdescribe : describe;
export const adminOnlyIT = getPublicEnv('NON_PRIV') ? xit : it;

export const TEST_NS = getPublicEnv('TEST_NS') || 'cy-test-ns';
export const NAD_NS = getPublicEnv('NAD_NS') || 'nad-test-ns';
export const UDN_NS = getPublicEnv('UDN_NS') || 'udn-test-ns';
export const EMPTY_NS = getPublicEnv('EMPTY_NS') || 'empty-test-ns';
export const CUDN_NS = getPublicEnv('CUDN_NS') || 'cudn-test-ns';
export const TOPO_NS = getPublicEnv('TOPO_NS') || 'topo-test-ns';
export const LOCALNET_NS = getPublicEnv('LOCALNET_NS') || 'localnet-test-ns';
export const EXAMPLE = 'example';
export const ALL_PROJ_NS = 'All Projects';
export const TEST_ROUTE_NAME = 'auto-test-route';
export const TEST_POL_NAME = 'auto-test-net-policy';
export const TEST_MULTI_NAME = 'auto-test-multi-policy';

export const SECOND = 1000;
export const MINUTE = 60000;

export const UDN_LABEL = 'k8s.ovn.org/primary-user-defined-network';
export const CUDN_MEMBER_LABEL = 'e2e.networking-console-plugin/cudn';
export const CUDN_31_MEMBER_LABEL = 'e2e.networking-console-plugin/cudn-31';
export const LOCALNET_MEMBER_LABEL = 'e2e.networking-console-plugin/localnet';

export enum K8S_KIND {
  CUDN = 'ClusterUserDefinedNetwork',
  NAD = 'net-attach-def',
  Project = 'project',
  UDN = 'UserDefinedNetwork',
}
