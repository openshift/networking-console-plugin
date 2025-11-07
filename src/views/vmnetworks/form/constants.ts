import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { LOCALNET_TOPOLOGY } from '@utils/resources/udns/constants';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkRole } from '@utils/resources/udns/types';

export const DEFAULT_MTU = 1500;

export const defaultVMNetwork: ClusterUserDefinedNetworkKind = {
  apiVersion: `${ClusterUserDefinedNetworkModel.apiGroup}/${ClusterUserDefinedNetworkModel.apiVersion}`,
  kind: ClusterUserDefinedNetworkModel.kind,
  metadata: {
    annotations: {},
    name: '',
  },
  spec: {
    namespaceSelector: {},
    network: {
      localnet: {
        ipam: {
          mode: 'Disabled',
        },
        mtu: null, // null on purpose so setting mtu to maxMTU (or DEFAULT_MTU) is done only once
        physicalNetworkName: '',

        role: UserDefinedNetworkRole.Secondary,
      },
      topology: LOCALNET_TOPOLOGY,
    },
  },
};

export type VMNetworkForm = {
  matchLabelCheck: boolean;
  network: ClusterUserDefinedNetworkKind;
  showProjectList: boolean;
};

export const defaultFormValue: VMNetworkForm = {
  matchLabelCheck: false,
  network: defaultVMNetwork,
  showProjectList: true,
};

export const MIN_VLAN_ID = 1;
export const MAX_VLAN_ID = 4094;

export const OVN_BRIDGE_MAPPINGS = 'bridge-mappings';
export const PREFIX_PHYSNET = 'physnet';
