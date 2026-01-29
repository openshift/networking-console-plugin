import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';

import {
  ClusterUserDefinedNetworkKind,
  UserDefinedNetworkKind,
  UserDefinedNetworkLayer3Subnet,
  UserDefinedNetworkLocalnet,
  UserDefinedNetworkSpec,
} from '../types';

export const getNetwork = (
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind,
): UserDefinedNetworkSpec => {
  return obj.spec?.network || obj.spec;
};

export const getLayer2Subnets = (
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind,
): string[] => {
  return getNetwork(obj)?.layer2?.subnets || [];
};

export const getLayer2JoinSubnets = (
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind,
): string[] => {
  return getNetwork(obj)?.layer2?.joinSubnets || [];
};

export const getLayer3Subnets = (
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind,
): UserDefinedNetworkLayer3Subnet[] => {
  return getNetwork(obj)?.layer3?.subnets || [];
};

export const getLayer3JoinSubnets = (
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind,
): string[] => {
  return getNetwork(obj)?.layer3?.joinSubnets || [];
};

export const getTopology = (
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind,
): string => {
  return getNetwork(obj)?.topology || null;
};

export const getDescription = (udn: UserDefinedNetworkKind): string => {
  return udn?.metadata?.annotations?.description;
};

export const getModel = (obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind) => {
  if (obj.kind === ClusterUserDefinedNetworkModel.kind) {
    return ClusterUserDefinedNetworkModel;
  } else {
    return UserDefinedNetworkModel;
  }
};

export const getMTU = (udn: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind): number => {
  if (udn.kind === ClusterUserDefinedNetworkModel.kind) {
    return (
      udn?.spec?.network?.layer2?.mtu ||
      udn?.spec?.network?.layer3?.mtu ||
      udn?.spec?.network?.localnet?.mtu
    );
  }

  return udn?.spec?.layer2?.mtu || udn?.spec?.layer3?.mtu;
};

export const getLocalnet = (cudn: ClusterUserDefinedNetworkKind): UserDefinedNetworkLocalnet =>
  cudn?.spec?.network?.localnet;

export const getVLANID = (cudn: ClusterUserDefinedNetworkKind): number =>
  getLocalnet(cudn)?.vlan?.access?.id;
