import {
  K8sResourceCommon,
  MatchExpression,
  Operator,
} from '@openshift-console/dynamic-plugin-sdk';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { getName } from '@utils/resources/shared';
import { getUDNConditions } from '@utils/resources/udns/selectors';
import { verifyMatchExpressions } from '@utils/utils';

import {
  CLUSTER_UDN_NAD_NAME_PREFIX,
  NETWORK_ALLOCATION_SUCCEEDED,
  NETWORK_CREATED,
} from './constants';
import {
  ClusterUserDefinedNetworkKind,
  UserDefinedNetworkKind,
  UserDefinedNetworkRole,
} from './types';

export type UDNResource = ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;

export const isClusterUDN = (udn: UDNResource): udn is ClusterUserDefinedNetworkKind =>
  udn.kind === ClusterUserDefinedNetworkModel.kind;

export const isPrimaryUDN = (udn: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind) => {
  const spec = isClusterUDN(udn) ? udn?.spec?.network : udn?.spec;
  return (
    spec?.layer2?.role === UserDefinedNetworkRole.Primary ||
    spec?.layer3?.role === UserDefinedNetworkRole.Primary ||
    spec?.localnet?.role === UserDefinedNetworkRole.Primary
  );
};

export const getUDNNADNameCandidates = (udn: UDNResource): string[] => {
  const udnName = getName(udn);

  if (!udnName) {
    return [];
  }

  if (isClusterUDN(udn)) {
    return [udnName, `${CLUSTER_UDN_NAD_NAME_PREFIX}${udnName}`, `cluster-udn-${udnName}`];
  }

  return [udnName];
};

export const udnIsReady = (udn: UDNResource) => {
  const conditions = getUDNConditions(udn);
  const networkCreationSuccessful =
    conditions?.find((condition) => condition.type === NETWORK_CREATED)?.status === 'True';
  const networkAllocationSuccessful =
    conditions?.find((condition) => condition.type === NETWORK_ALLOCATION_SUCCEEDED)?.status ===
    'True';

  return networkCreationSuccessful && networkAllocationSuccessful;
};

export const getCUDNProjects = (
  cudn: ClusterUserDefinedNetworkKind,
  projects: K8sResourceCommon[],
): K8sResourceCommon[] => {
  const namespaceSelector = cudn?.spec?.namespaceSelector || {};

  const matchLabelsToExpressions = Object.entries(namespaceSelector.matchLabels || {}).map(
    ([key, value]): MatchExpression => ({
      key,
      operator: Operator.Equals,
      values: [value],
    }),
  );

  const matchExpressions = namespaceSelector.matchExpressions || [];

  const combinedExpressions = [...matchLabelsToExpressions, ...matchExpressions];

  return projects?.filter((project) => verifyMatchExpressions(project, combinedExpressions)) || [];
};

export const getCUDNNamespaceNames = (
  cudn: ClusterUserDefinedNetworkKind,
  projects: K8sResourceCommon[],
) => getCUDNProjects(cudn, projects).map((project) => getName(project)) || [];
