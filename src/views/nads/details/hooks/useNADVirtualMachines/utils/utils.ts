import { V1Network, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { INTERFACE_STATE_ABSENT } from '@utils/resources/vm/constants';
import { getInterfaces, getNetworks } from '@utils/resources/vm/selectors';
import { multusNetworkMatchesNAD } from '@utils/resources/vm/utils';

export type NADVirtualMachine = {
  interfaceName: string;
  vm: V1VirtualMachine;
};

export const vmUsesNAD = (vm: V1VirtualMachine, nad: NetworkAttachmentDefinitionKind): boolean =>
  getNetworks(vm).some((network) => networkUsesNAD(network, nad, vm));

const networkUsesNAD = (
  network: V1Network,
  nad: NetworkAttachmentDefinitionKind,
  vm: V1VirtualMachine,
): boolean => {
  if (!multusNetworkMatchesNAD(network, nad, vm)) {
    return false;
  }

  const iface = getInterfaces(vm).find((item) => item.name === network.name);

  return iface?.state !== INTERFACE_STATE_ABSENT;
};

export const getNADVirtualMachines = (
  vms: undefined | V1VirtualMachine[],
  nad: NetworkAttachmentDefinitionKind | undefined,
): NADVirtualMachine[] => {
  if (!nad) {
    return [];
  }

  return (vms ?? []).flatMap((vm) => {
    const matchingNetworks = getNetworks(vm).filter((network) => networkUsesNAD(network, nad, vm));

    if (matchingNetworks.length === 0) {
      return [];
    }

    return [{ interfaceName: matchingNetworks[0].name, vm }];
  });
};
