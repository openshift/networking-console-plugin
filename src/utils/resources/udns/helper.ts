import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { getName } from '@utils/resources/shared';

import { CLUSTER_UDN_NAD_NAME_PREFIX } from './constants';
import {
  ClusterUserDefinedNetworkKind,
  UserDefinedNetworkKind,
  UserDefinedNetworkRole,
} from './types';

export type UDNResource = ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;

export const isPrimaryUDN = (udn: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind) =>
  udn?.spec?.layer2?.role === UserDefinedNetworkRole.Primary ||
  udn?.spec?.network?.layer2?.role === UserDefinedNetworkRole.Primary;

export const isClusterUDN = (udn: UDNResource): udn is ClusterUserDefinedNetworkKind =>
  udn.kind === ClusterUserDefinedNetworkModel.kind;

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
