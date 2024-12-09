import { ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '@utils/constants';
import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import {
  ClusterUserDefinedNetworkKind,
  UserDefinedNetworkKind,
  UserDefinedNetworkRole,
} from '@utils/resources/udns/types';
import { generateName } from '@utils/utils';

import { UDNForm } from './constants';

export const createUDN = (name: string, namespace: string): UserDefinedNetworkKind => ({
  apiVersion: `${UserDefinedNetworkModel.apiGroup}/${UserDefinedNetworkModel.apiVersion}`,
  kind: UserDefinedNetworkModel.kind,
  metadata: {
    name,
    namespace,
  },
  spec: {
    layer2: {
      ipamLifecycle: 'Persistent',
      role: UserDefinedNetworkRole.Primary,
      subnets: [''],
    },
    topology: 'Layer2',
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
        ipamLifecycle: 'Persistent',
        role: UserDefinedNetworkRole.Primary,
        subnets: [''],
      },
      topology: 'Layer2',
    },
  },
});

export const getDefaultUDN = (isClusterUDN: boolean, namespace: string): UDNForm => {
  return isClusterUDN
    ? createClusterUDN(generateName('cluster-udn'))
    : createUDN(
        generateName('udn'),
        namespace === ALL_NAMESPACES_KEY ? DEFAULT_NAMESPACE : namespace,
      );
};
