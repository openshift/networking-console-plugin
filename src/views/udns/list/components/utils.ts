import { K8sResourceCommon, MatchLabels } from '@openshift-console/dynamic-plugin-sdk';
import { ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '@utils/constants';
import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import {
  FIXED_PRIMARY_UDN_NAME,
  LAYER2_TOPOLOGY,
  LAYER3_TOPOLOGY,
  LOCALNET_TOPOLOGY,
} from '@utils/resources/udns/constants';
import {
  ClusterUserDefinedNetworkKind,
  UserDefinedNetworkKind,
  UserDefinedNetworkRole,
  UserDefinedNetworkSpec,
} from '@utils/resources/udns/types';
import { generateName, isEmpty } from '@utils/utils';

import { UDNForm } from './constants';

export const match = (resource: K8sResourceCommon, matchLabels: MatchLabels) =>
  Object.entries(matchLabels || {})?.every(
    ([key, value]) => resource?.metadata?.labels?.[key] === value,
  );

const defaultConfiguration = {
  ipam: { lifecycle: 'Persistent' },
  role: UserDefinedNetworkRole.Primary,
  subnets: [''],
};

export const createUDN = (namespace: string): UserDefinedNetworkKind => ({
  apiVersion: `${UserDefinedNetworkModel.apiGroup}/${UserDefinedNetworkModel.apiVersion}`,
  kind: UserDefinedNetworkModel.kind,
  metadata: {
    name: FIXED_PRIMARY_UDN_NAME,
    namespace,
  },
  spec: {
    layer2: defaultConfiguration,
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
      layer2: defaultConfiguration,
      topology: 'Layer2',
    },
  },
});

export const getDefaultUDN = (isClusterUDN: boolean, namespace: string): UDNForm => {
  return isClusterUDN
    ? createClusterUDN(generateName('cluster-udn'))
    : createUDN(namespace === ALL_NAMESPACES_KEY ? DEFAULT_NAMESPACE : namespace);
};

export const getSubnetsFromNetworkSpec = (networkSpec: UserDefinedNetworkSpec) =>
  networkSpec?.layer2?.subnets ||
  networkSpec?.layer3?.subnets ||
  networkSpec?.localnet?.subnets ||
  networkSpec?.layer2?.subnets ||
  networkSpec?.layer3?.subnets ||
  networkSpec?.localnet?.subnets;

export const getSubnetFields = (networkSpec: UserDefinedNetworkSpec, isClusterUDN) => {
  const topology = getTopology(networkSpec);

  return isClusterUDN
    ? `spec.network.${topology.toLowerCase()}.subnets`
    : `spec.${topology.toLowerCase()}.subnets`;
};

export const isUDNValid = (udn: UDNForm): boolean => {
  const clusterUDNConnected =
    !isEmpty(udn?.spec?.namespaceSelector?.matchExpressions) ||
    !isEmpty(udn?.spec?.namespaceSelector?.matchLabels);

  const subnets = getSubnetsFromNetworkSpec(udn?.spec?.network || udn?.spec);

  if (isEmpty(subnets) || isEmpty(subnets?.[0])) return false;

  return !isEmpty(udn?.metadata?.namespace) || clusterUDNConnected;
};

export const getRolePath = (networkSpec: UserDefinedNetworkSpec, isClusterUDN: boolean) => {
  if (isClusterUDN) {
    return !isEmpty(networkSpec?.layer2) ? 'spec.network.layer2.role' : 'spec.network.layer3.role';
  }
  return !isEmpty(networkSpec?.layer2) ? 'spec.layer2.role' : 'spec.layer3.role';
};

export const getTopology = (networkSpec: UserDefinedNetworkSpec) => {
  if (!isEmpty(networkSpec?.layer2)) return LAYER2_TOPOLOGY;
  if (!isEmpty(networkSpec?.layer3)) return LAYER3_TOPOLOGY;
  if (!isEmpty(networkSpec?.localnet)) return LOCALNET_TOPOLOGY;
};

const convertSubnetsFromLayer3 = (
  layer3NetworkSpec: UserDefinedNetworkSpec,
): UserDefinedNetworkSpec['layer2']['subnets'] | UserDefinedNetworkSpec['localnet']['subnets'] =>
  layer3NetworkSpec.layer3.subnets.map((subnet) => subnet.cidr);

const convertToLayer3Subnets = (
  networkSpec: UserDefinedNetworkSpec,
): UserDefinedNetworkSpec['layer3']['subnets'] =>
  (networkSpec.layer2 || networkSpec.localnet).subnets.map((subnet) => ({ cidr: subnet }));

export const createNetworkSpecFromTopology = (
  newTopology: string,
  currentNetworkSpec: UserDefinedNetworkSpec,
): UserDefinedNetworkSpec => {
  const currentConfiguration =
    currentNetworkSpec.layer2 || currentNetworkSpec.layer3 || currentNetworkSpec.localnet;

  switch (newTopology) {
    case 'Layer2':
      const layer2Subnet = currentNetworkSpec.layer3
        ? convertSubnetsFromLayer3(currentNetworkSpec)
        : currentConfiguration.subnets;

      return {
        layer2: {
          ipam: defaultConfiguration.ipam,
          role: currentConfiguration.role,
          subnets: layer2Subnet as UserDefinedNetworkSpec['layer2']['subnets'],
        },
        topology: 'Layer2',
      };

    case 'Layer3':
      const layer3Subnets = currentNetworkSpec.layer3
        ? currentConfiguration.subnets
        : convertToLayer3Subnets(currentNetworkSpec);

      return {
        layer3: {
          role: UserDefinedNetworkRole.Primary,
          subnets: layer3Subnets as UserDefinedNetworkSpec['layer3']['subnets'],
        },
        topology: 'Layer3',
      };
    case 'Localnet':
      const localnetSubnets = currentNetworkSpec.layer3
        ? convertSubnetsFromLayer3(currentNetworkSpec)
        : currentConfiguration.subnets;
      return {
        localnet: {
          physicalNetworkName: '',
          role: UserDefinedNetworkRole.Secondary,
          subnets: localnetSubnets as UserDefinedNetworkSpec['localnet']['subnets'],
        },
        topology: 'Localnet',
      };
  }
};

export const createNetworkSpecFromRole = (
  currentNetworkSpec: UserDefinedNetworkSpec,
  role: UserDefinedNetworkRole,
): UserDefinedNetworkSpec => {
  const currentConfiguration =
    currentNetworkSpec.layer2 || currentNetworkSpec.layer3 || currentNetworkSpec.localnet;

  const subnets = currentNetworkSpec.layer3
    ? convertSubnetsFromLayer3(currentNetworkSpec)
    : currentConfiguration.subnets;

  if (role === UserDefinedNetworkRole.Primary)
    return {
      layer2: {
        ...defaultConfiguration,
        subnets: subnets as UserDefinedNetworkSpec['layer2']['subnets'],
      },

      topology: 'Layer2',
    };

  return {
    localnet: {
      ...defaultConfiguration,
      physicalNetworkName: '',
      role,
      subnets: subnets as UserDefinedNetworkSpec['localnet']['subnets'],
    },
    topology: 'localnet',
  };
};
