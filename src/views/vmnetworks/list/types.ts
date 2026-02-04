import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

export enum VMNetworkType {
  INVALID = 'invalid',
  LINUX_BRIDGE = 'linux_bridge',
  LOCALNET = 'localnet',
  PRIMARY_UDN = 'primary_udn',
  SECONDARY_LAYER2_OVERLAY = 'secondary_layer2_overlay',
  SRIOV = 'sriov',
}

export type OtherVMNetwork =
  | ClusterUserDefinedNetworkKind
  | NetworkAttachmentDefinitionKind
  | UserDefinedNetworkKind;

export type OtherVMNetworkWithType = {
  type: VMNetworkType;
} & OtherVMNetwork;
