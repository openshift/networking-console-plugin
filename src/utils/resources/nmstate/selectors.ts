import { TFunction } from 'i18next';

import {
  InterfaceType,
  NodeNetworkConfigurationInterface,
  NodeNetworkConfigurationInterfaceBridgePort,
  OVNBridgeMapping,
  V1beta1NodeNetworkConfigurationEnactment,
  V1NodeNetworkConfigurationPolicy,
} from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { NO_DATA_DASH } from '@utils/utils/constants';

import {
  DEFAULT_OVN_BRIDGE_NAME,
  DEFAULT_OVS_INTERFACE_NAME,
  ENACTMENT_LABEL_NODE,
  ENACTMENT_LABEL_POLICY,
  LINK_AGGREGATION,
  OVN_BRIDGE_MAPPINGS,
} from './constants';
import { NodeNetworkStateKind, ObservedBridgeMapping } from './types';

export enum UplinkConnection {
  BondingInterface = 'bonding_interface',
  Brex = 'brex',
  SingleDevice = 'single_device',
}

/* Policy getters */

export const getOVNConfiguration = (policy: V1NodeNetworkConfigurationPolicy) =>
  policy?.spec?.desiredState?.ovn;

export const getNodeSelector = (policy: V1NodeNetworkConfigurationPolicy) =>
  policy?.spec?.nodeSelector;

/* Policy selectors */

export const getPolicyInterfaces = (
  policy: V1NodeNetworkConfigurationPolicy,
): NodeNetworkConfigurationInterface[] => policy?.spec?.desiredState?.interfaces || [];

export const getOVN = (policy: V1NodeNetworkConfigurationPolicy) =>
  policy?.spec?.desiredState?.ovn;

export const getPolicyBondingInterfaces = (policy: V1NodeNetworkConfigurationPolicy) =>
  getPolicyInterfaces(policy)?.filter((iface) => iface?.type === InterfaceType.BOND) || [];

export const getPolicyBridgingInterfaces = (policy: V1NodeNetworkConfigurationPolicy) =>
  getPolicyInterfaces(policy)?.filter((iface) =>
    [InterfaceType.LINUX_BRIDGE, InterfaceType.OVS_BRIDGE].includes(iface?.type),
  ) || [];

export const getBridgeInterface = (policy: V1NodeNetworkConfigurationPolicy) =>
  getPolicyBridgingInterfaces(policy)?.[0];

export const getBridgeManagementInterface = (policy: V1NodeNetworkConfigurationPolicy) =>
  getPolicyInterfaces(policy)?.filter((iface) => iface?.type === InterfaceType.OVS_INTERFACE)?.[0];

export const getBridgePorts = (policy: V1NodeNetworkConfigurationPolicy) =>
  getBridgeInterface(policy)?.bridge?.port || [];

export const getBondInterface = (policy: V1NodeNetworkConfigurationPolicy) =>
  getPolicyBondingInterfaces(policy)?.[0];

export const getMTU = (policy: V1NodeNetworkConfigurationPolicy) =>
  getBridgeManagementInterface(policy)?.mtu;

export const getBond = (policy: V1NodeNetworkConfigurationPolicy) =>
  getBondInterface(policy) || getOVSBridgeBondPort(policy);

export const getLinkAggregationSettings = (policy: V1NodeNetworkConfigurationPolicy) =>
  getBond(policy)?.[LINK_AGGREGATION];

export const getAggregationMode = (policy: V1NodeNetworkConfigurationPolicy) =>
  getLinkAggregationSettings(policy)?.mode;

const getBondInterfacePorts = (policy: V1NodeNetworkConfigurationPolicy): string[] =>
  getBondInterface(policy)?.[LINK_AGGREGATION]?.port;

export const getOVSBridgeBondPort = (policy: V1NodeNetworkConfigurationPolicy) =>
  getBridgePorts(policy)?.find((port) => port?.[LINK_AGGREGATION]);

const getBridgeBondPorts = (
  policy: V1NodeNetworkConfigurationPolicy,
): NodeNetworkConfigurationInterfaceBridgePort[] =>
  getOVSBridgeBondPort(policy)?.[LINK_AGGREGATION].port;

export const getBondPorts = (
  policy: V1NodeNetworkConfigurationPolicy,
): NodeNetworkConfigurationInterfaceBridgePort[] | string[] =>
  getBondInterfacePorts(policy) || getBridgeBondPorts(policy);

export const getBondPortNames = (policy: V1NodeNetworkConfigurationPolicy) => {
  const bondPorts = getBondPorts(policy);

  if (typeof bondPorts?.[0] === 'string') return bondPorts as string[];

  return (bondPorts as NodeNetworkConfigurationInterfaceBridgePort[])?.map((port) => port?.name);
};

export const getBridgePortNames = (policy: V1NodeNetworkConfigurationPolicy) =>
  getBridgePorts(policy)?.map((port) => port?.name);

export const getOVNBridgeMapping = (policy: V1NodeNetworkConfigurationPolicy) =>
  getOVN(policy)?.[OVN_BRIDGE_MAPPINGS]?.[0];

export const getOVNBridgeName = (policy: V1NodeNetworkConfigurationPolicy) =>
  getOVNBridgeMapping(policy)?.bridge;

export const getBondName = (policy: V1NodeNetworkConfigurationPolicy) => getBond(policy)?.name;

export const getPolicyLocalnetNames = (policy: V1NodeNetworkConfigurationPolicy): string[] => {
  const bridgeMappings: OVNBridgeMapping[] = getOVN(policy)?.[OVN_BRIDGE_MAPPINGS] || [];
  return bridgeMappings.map((mapping) => mapping?.localnet).filter(Boolean);
};

export const getUplinkConnectionOption = (
  policy: V1NodeNetworkConfigurationPolicy,
): '' | UplinkConnection => {
  const bridgePorts = getBridgePortNames(policy);
  const bondPorts = getBondPortNames(policy);
  const bridgeName = getOVNBridgeName(policy);

  if (bridgeName === DEFAULT_OVN_BRIDGE_NAME) return UplinkConnection.Brex;
  if (bondPorts?.length > 0) return UplinkConnection.BondingInterface;
  if (bridgePorts?.length === 1) return UplinkConnection.SingleDevice;
  return '';
};

export const getBridgePortsWithoutDefaultOVSIface = (policy: V1NodeNetworkConfigurationPolicy) =>
  getBridgePortNames(policy)?.filter((port) => port !== DEFAULT_OVS_INTERFACE_NAME) || [];

export const getBondUplinkDisplayText = (policy: V1NodeNetworkConfigurationPolicy) => {
  const bondPorts = getBridgePortsWithoutDefaultOVSIface(policy).join(' + ');
  const bondName = getBondName(policy);
  const aggregationMode = getAggregationMode(policy);

  return `${bondName} (${bondPorts}), mode=(${aggregationMode})`;
};

export const getUplinkDisplayText = (
  policy: V1NodeNetworkConfigurationPolicy,
  t: TFunction,
): string => {
  const connectionOption = getUplinkConnectionOption(policy);
  switch (connectionOption) {
    case UplinkConnection.Brex:
      return t("Cluster's default network");
    case UplinkConnection.SingleDevice:
      return getBridgePortsWithoutDefaultOVSIface(policy)?.[0];
    case UplinkConnection.BondingInterface:
      return getBondUplinkDisplayText(policy);
    default:
      return NO_DATA_DASH;
  }
};

/* Enactment selectors */

export const getEnactmentStateNNCP = (
  enactment: V1beta1NodeNetworkConfigurationEnactment,
): string => enactment?.metadata?.labels?.[ENACTMENT_LABEL_POLICY];

export const getEnactmentStateNode = (
  enactment: V1beta1NodeNetworkConfigurationEnactment,
): string => enactment?.metadata?.labels?.[ENACTMENT_LABEL_NODE];

export const getEnactmentStatus = (
  enactment: V1beta1NodeNetworkConfigurationEnactment,
): string => enactment?.status?.conditions?.find((condition) => condition.status === 'True')?.type;

/* Observed bridge mappings */

export const getObservedBridgeMappings = (
  nodeNetworkStates: NodeNetworkStateKind[],
): ObservedBridgeMapping[] => {
  if (!Array.isArray(nodeNetworkStates)) return [];

  const mappings: ObservedBridgeMapping[] = [];
  const seen = new Set<string>();

  nodeNetworkStates.forEach((nodeNetworkState) => {
    const nodeName = nodeNetworkState?.metadata?.name;

    nodeNetworkState?.status?.currentState?.ovn?.[OVN_BRIDGE_MAPPINGS]?.forEach((mapping) => {
      if (!mapping?.localnet || mapping.state === 'absent') return;

      const key = `${nodeName}/${mapping.localnet}`;
      if (seen.has(key)) return;
      seen.add(key);

      mappings.push({ bridge: mapping.bridge, localnet: mapping.localnet, nodeName });
    });
  });

  return mappings;
};
