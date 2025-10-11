import {
  InterfaceType,
  NodeNetworkConfigurationInterface,
  OVNBridgeMapping,
  V1beta1NodeNetworkState,
  V1NodeNetworkConfigurationPolicySpec,
} from '@kubevirt-ui/kubevirt-api/nmstate';
import { isEmpty } from '@utils/utils';

import { OVN_BRIDGE_MAPPINGS } from '../constants';

const getBridgePorts = (bridgeInterfaces: NodeNetworkConfigurationInterface[]) =>
  bridgeInterfaces.flatMap((iface) => {
    const ports = iface.bridge?.port;

    if (ports?.length !== 1) {
      return [];
    }

    const port = ports[0];

    return port['link-aggregation']?.port?.map((p) => p.name) ?? port.name;
  });

export const getBridgeMTU = (
  bridgeName: string,
  nncpSpec: V1NodeNetworkConfigurationPolicySpec,
  nodeNetworkState: V1beta1NodeNetworkState,
) => {
  if (bridgeName === 'br-ex') {
    return (
      (nodeNetworkState?.status?.currentState?.interfaces?.find(
        (iface: NodeNetworkConfigurationInterface) =>
          iface.name === bridgeName && iface.type === InterfaceType.OVS_INTERFACE,
      )?.mtu as number) ?? Infinity
    );
  }

  const interfaces: NodeNetworkConfigurationInterface[] = nncpSpec.desiredState?.interfaces;
  const bridgeInterfaces = interfaces?.filter(
    (iface) => iface.name === bridgeName && iface.type === InterfaceType.OVS_BRIDGE,
  );

  if (isEmpty(bridgeInterfaces)) {
    return Infinity;
  }

  const ports = getBridgePorts(bridgeInterfaces);
  const portInterfaces = interfaces.filter((iface) => ports.includes(iface.name));

  const mtus = portInterfaces.map((iface) => iface.mtu ?? Infinity);

  return Math.min(...mtus);
};

export const getBridgeNames = (
  localnet: string,
  nncpSpec: V1NodeNetworkConfigurationPolicySpec,
): string[] =>
  (nncpSpec.desiredState?.ovn?.[OVN_BRIDGE_MAPPINGS] as OVNBridgeMapping[])
    ?.filter((mapping) => mapping.localnet === localnet)
    .map((mapping) => mapping.bridge);
