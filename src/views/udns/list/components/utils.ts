import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import { FIXED_PRIMARY_UDN_NAME, LAYER2_TOPOLOGY } from '@utils/resources/udns/constants';
import {
  ClusterUserDefinedNetworkKind,
  UserDefinedNetworkKind,
  UserDefinedNetworkRole,
} from '@utils/resources/udns/types';
import { generateName, isEmpty } from '@utils/utils';

import { UDNForm } from './constants';

export const createUDN = (namespace?: string): UserDefinedNetworkKind => ({
  apiVersion: `${UserDefinedNetworkModel.apiGroup}/${UserDefinedNetworkModel.apiVersion}`,
  kind: UserDefinedNetworkModel.kind,
  metadata: {
    name: FIXED_PRIMARY_UDN_NAME,
    namespace,
  },
  spec: {
    layer2: {
      ipam: { lifecycle: 'Persistent' },
      role: UserDefinedNetworkRole.Primary,
      subnets: [''],
    },
    topology: LAYER2_TOPOLOGY,
  },
});

export const createClusterUDN = (name: string): ClusterUserDefinedNetworkKind => ({
  apiVersion: `${ClusterUserDefinedNetworkModel.apiGroup}/${ClusterUserDefinedNetworkModel.apiVersion}`,
  kind: ClusterUserDefinedNetworkModel.kind,
  metadata: {
    name,
  },
  spec: {
    namespaceSelector: { matchExpressions: [] },
    network: {
      layer2: {
        ipam: { lifecycle: 'Persistent' },
        role: UserDefinedNetworkRole.Primary,
        subnets: [''],
      },
      topology: LAYER2_TOPOLOGY,
    },
  },
});

export const getDefaultUDN = (isClusterUDN: boolean): UDNForm => {
  return isClusterUDN ? createClusterUDN(generateName('cluster-udn')) : createUDN();
};

export const isUDNValid = (udn: UDNForm): boolean => {
  const clusterUDNConnected =
    !isEmpty(udn?.spec?.namespaceSelector?.matchExpressions) ||
    !isEmpty(udn?.spec?.namespaceSelector?.matchLabels);

  return !isEmpty(udn?.metadata?.namespace) || clusterUDNConnected;
};
