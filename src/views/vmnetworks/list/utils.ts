import { TFunction } from 'react-i18next';

import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import { getConfigAsJSON } from '@utils/resources/nads/selectors';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { LAYER2_TOPOLOGY, LOCALNET_TOPOLOGY } from '@utils/resources/udns/constants';
import { getNetwork } from '@utils/resources/udns/selectors';
import {
  ClusterUserDefinedNetworkKind,
  IPAM_MODE_DISABLED,
  UserDefinedNetworkKind,
  UserDefinedNetworkRole,
} from '@utils/resources/udns/types';
import { NO_DATA_DASH } from '@utils/utils/constants';
import { NetworkTypeKeys, ovnK8sRoleKeys, ovnK8sTopologyKeys } from '@views/nads/form/utils/types';

import { OtherVMNetwork, VMNetworkType } from './types';

const getVMNetworkTypeFromUDN = (
  udn: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind,
): VMNetworkType => {
  const networkSpec = getNetwork(udn);
  const topology = networkSpec.topology;

  if (topology === LOCALNET_TOPOLOGY) {
    return VMNetworkType.LOCALNET;
  }

  if (networkSpec.layer2?.role === UserDefinedNetworkRole.Primary) {
    return VMNetworkType.PRIMARY_UDN;
  }

  if (
    topology === LAYER2_TOPOLOGY &&
    networkSpec.layer2?.role === UserDefinedNetworkRole.Secondary &&
    networkSpec.layer2?.ipam?.mode === IPAM_MODE_DISABLED
  ) {
    return VMNetworkType.SECONDARY_LAYER2_OVERLAY;
  }

  return VMNetworkType.INVALID;
};

const getVMNetworkTypeFromNAD = (nad: NetworkAttachmentDefinitionKind): VMNetworkType => {
  const config = getConfigAsJSON(nad);
  if (!config) return VMNetworkType.INVALID;

  const { role, topology, type } = config;

  if (type === NetworkTypeKeys.cnvBridgeNetworkType) {
    return VMNetworkType.LINUX_BRIDGE;
  }

  if (type === NetworkTypeKeys.sriovNetworkType) {
    return VMNetworkType.SRIOV;
  }

  if (type === NetworkTypeKeys.ovnKubernetesNetworkType) {
    if (topology === ovnK8sTopologyKeys.ovnK8sLocalnet) {
      return VMNetworkType.LOCALNET;
    }

    if (role !== ovnK8sRoleKeys.primary && topology === ovnK8sTopologyKeys.ovnK8sLayer) {
      return VMNetworkType.SECONDARY_LAYER2_OVERLAY;
    }
  }

  return VMNetworkType.INVALID;
};

const isNAD = (network: OtherVMNetwork): network is NetworkAttachmentDefinitionKind => {
  return network.kind === NetworkAttachmentDefinitionModel.kind;
};

export const getVMNetworkType = (network: OtherVMNetwork): VMNetworkType => {
  if (isNAD(network)) {
    return getVMNetworkTypeFromNAD(network);
  }
  return getVMNetworkTypeFromUDN(network);
};

export const getVMNetworkTypeLabel = (networkType: VMNetworkType, t: TFunction) =>
  ({
    [VMNetworkType.INVALID]: NO_DATA_DASH,
    [VMNetworkType.LINUX_BRIDGE]: t('Linux bridge'),
    [VMNetworkType.LOCALNET]: t('Localnet'),
    [VMNetworkType.PRIMARY_UDN]: t('Primary user-defined network'),
    [VMNetworkType.SECONDARY_LAYER2_OVERLAY]: t('Secondary layer2 overlay'),
    [VMNetworkType.SRIOV]: t('SR-IOV'),
  })[networkType];

export const hasUDNOwner = (nad: NetworkAttachmentDefinitionKind): boolean =>
  nad?.metadata?.ownerReferences?.some(
    (owner) =>
      owner.kind === ClusterUserDefinedNetworkModel.kind ||
      owner.kind === UserDefinedNetworkModel.kind,
  ) ?? false;
