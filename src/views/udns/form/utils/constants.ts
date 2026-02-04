import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import { LAYER2_TOPOLOGY } from '@utils/resources/udns/constants';
import {
  ClusterUserDefinedNetworkKind,
  UserDefinedNetworkKind,
  UserDefinedNetworkRole,
} from '@utils/resources/udns/types';
import { generateName } from '@utils/utils';

export const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY =
  'console.createUserDefinedNetwork.editor.lastView';

export const generateDefaultCUDN = (): ClusterUserDefinedNetworkKind => ({
  apiVersion: `${ClusterUserDefinedNetworkModel.apiGroup}/${ClusterUserDefinedNetworkModel.apiVersion}`,
  kind: ClusterUserDefinedNetworkModel.kind,
  metadata: {
    name: generateName('cudn'),
  },
  spec: {
    namespaceSelector: {
      matchExpressions: [],
      matchLabels: {},
    },
    network: {
      layer2: {
        role: UserDefinedNetworkRole.Primary,
        subnets: [''],
      },
      layer3: {
        role: UserDefinedNetworkRole.Primary,
        subnets: [{ cidr: '' }],
      },
      topology: LAYER2_TOPOLOGY,
    },
  },
});

export const generateDefaultUDN = (): UserDefinedNetworkKind => ({
  apiVersion: `${UserDefinedNetworkModel.apiGroup}/${UserDefinedNetworkModel.apiVersion}`,
  kind: UserDefinedNetworkModel.kind,
  metadata: {
    name: generateName('udn'),
  },
  spec: {
    layer2: {
      role: UserDefinedNetworkRole.Primary,
      subnets: [''],
    },
    layer3: {
      role: UserDefinedNetworkRole.Primary,
      subnets: [{ cidr: '' }],
    },
    topology: LAYER2_TOPOLOGY,
  },
});
