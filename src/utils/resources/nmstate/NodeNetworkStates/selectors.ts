import {
  InterfaceType,
  NodeNetworkConfigurationInterface,
  V1beta1NodeNetworkState,
} from '@kubevirt-ui-ext/kubevirt-api/nmstate';

import { BR_INT, GENEV_SYS_PREFIX, OVN_K8S_MP0 } from './constants';

/**
 * Get interfaces from NodeNetworkState
 */
export const getNNSInterfaces = (
  nns: V1beta1NodeNetworkState,
): NodeNetworkConfigurationInterface[] => nns?.status?.currentState?.interfaces || [];

/**
 * Filter out management and internal interfaces
 */
export const getVisibleInterfaces = (
  interfaces: NodeNetworkConfigurationInterface[],
): NodeNetworkConfigurationInterface[] =>
  interfaces.filter(
    (iface) =>
      !iface.patch &&
      iface.type !== InterfaceType.LOOPBACK &&
      iface.name !== OVN_K8S_MP0 &&
      iface.name !== BR_INT &&
      !iface.name.startsWith(GENEV_SYS_PREFIX),
  );

/**
 * Find interface by name in an array of interfaces
 */
export const findInterfaceByName = (
  interfaces: NodeNetworkConfigurationInterface[],
  interfaceName: string,
): boolean => interfaces.some((iface) => iface.name === interfaceName);
