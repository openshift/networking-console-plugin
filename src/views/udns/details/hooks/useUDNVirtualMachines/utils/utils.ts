import { V1Network, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { UDNResource } from '@utils/resources/udns/helper';
import { INTERFACE_STATE_ABSENT } from '@utils/resources/vm/constants';
import { getInterfaces, getNetworks } from '@utils/resources/vm/selectors';
import { findNADForUDN, multusNetworkMatchesUDN } from '@utils/resources/vm/utils';

export type UDNVirtualMachine = {
  interfaceName: string;
  nad?: NetworkAttachmentDefinitionKind;
  vm: V1VirtualMachine;
};

const networkUsesUDN = (network: V1Network, udn: UDNResource, vm: V1VirtualMachine): boolean => {
  if (!multusNetworkMatchesUDN(network, udn, vm)) {
    return false;
  }

  const iface = getInterfaces(vm).find((item) => item.name === network.name);

  return iface?.state !== INTERFACE_STATE_ABSENT;
};

export const vmUsesUDN = (vm: V1VirtualMachine, udn: UDNResource | undefined): boolean => {
  if (!udn) {
    return false;
  }

  return getNetworks(vm).some((network) => networkUsesUDN(network, udn, vm));
};

export const getUDNVirtualMachines = (
  vms: undefined | V1VirtualMachine[],
  udn: UDNResource | undefined,
  nads: NetworkAttachmentDefinitionKind[] | undefined,
): UDNVirtualMachine[] => {
  if (!udn) {
    return [];
  }

  return (vms ?? []).flatMap((vm) => {
    const matchingNetworks = getNetworks(vm).filter((network) => networkUsesUDN(network, udn, vm));

    if (matchingNetworks.length === 0) {
      return [];
    }

    return [
      {
        interfaceName: matchingNetworks[0].name,
        nad: findNADForUDN(nads, udn, vm),
        vm,
      },
    ];
  });
};
