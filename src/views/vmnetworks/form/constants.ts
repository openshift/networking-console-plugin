import { DEFAULT_NAMESPACE } from '@utils/constants';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { LOCALNET_TOPOLOGY, PROJECT_NAME_LABEL_KEY } from '@utils/resources/udns/constants';
import {
  ClusterUserDefinedNetworkKind,
  IPAM_MODE_DISABLED,
  UserDefinedNetworkRole,
} from '@utils/resources/udns/types';

export const DEFAULT_MTU = 1500;
export const NODE_NETWORK_MAPPING_PARAM_KEY = 'physicalNetworkName';

export const getDefaultVMNetwork = (nodeNetworkMapping = ''): ClusterUserDefinedNetworkKind => ({
  apiVersion: `${ClusterUserDefinedNetworkModel.apiGroup}/${ClusterUserDefinedNetworkModel.apiVersion}`,
  kind: ClusterUserDefinedNetworkModel.kind,
  metadata: {
    annotations: {},
    name: '',
  },
  spec: {
    namespaceSelector: { matchLabels: { [PROJECT_NAME_LABEL_KEY]: DEFAULT_NAMESPACE } },
    network: {
      localnet: {
        ipam: {
          mode: IPAM_MODE_DISABLED,
        },
        mtu: null, // null on purpose so setting mtu to maxMTU (or DEFAULT_MTU) is done only once
        physicalNetworkName: nodeNetworkMapping,

        role: UserDefinedNetworkRole.Secondary,
      },
      topology: LOCALNET_TOPOLOGY,
    },
  },
});

export enum ProjectMappingOption {
  AllProjects = 'all-projects',
  SelectByLabels = 'select-by-labels',
  SelectFromList = 'select-from-list',
}

export type VMNetworkForm = {
  network: ClusterUserDefinedNetworkKind;
  projectMappingOption: ProjectMappingOption;
};

export const getDefaultFormValue = (nodeNetworkMapping?: string): VMNetworkForm => ({
  network: getDefaultVMNetwork(nodeNetworkMapping),
  projectMappingOption: ProjectMappingOption.AllProjects,
});

export const MIN_VLAN_ID = 1;
export const MAX_VLAN_ID = 4094;

export const OVN_BRIDGE_MAPPINGS = 'bridge-mappings';
export const PREFIX_PHYSNET = 'physnet';
