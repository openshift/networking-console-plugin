import { useCallback, useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1Network, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getInterfaces, getNetworks } from '@utils/resources/vm/selectors';
import { findNADForUDN, multusNetworkMatchesUDN, UDNResource } from '@utils/resources/vm/utils';

export type UDNVirtualMachine = {
  interfaceName: string;
  nad?: NetworkAttachmentDefinitionKind;
  vm: V1VirtualMachine;
};

type UseUDNVirtualMachinesResult = {
  availableVirtualMachines: V1VirtualMachine[];
  getNADForVM: (vm: V1VirtualMachine) => NetworkAttachmentDefinitionKind | undefined;
  loaded: boolean;
  loadError: unknown;
  virtualMachines: UDNVirtualMachine[];
};

const networkUsesUDN = (network: V1Network, udn: UDNResource, vm: V1VirtualMachine): boolean => {
  if (!multusNetworkMatchesUDN(network, udn, vm)) {
    return false;
  }

  const iface = getInterfaces(vm).find((item) => item.name === network.name);

  return iface?.state !== 'absent';
};

export const vmUsesUDN = (vm: V1VirtualMachine, udn: UDNResource | undefined): boolean =>
  Boolean(udn) && getNetworks(vm).some((network) => networkUsesUDN(network, udn, vm));

const getUDNVirtualMachines = (
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

const useUDNVirtualMachines = (udn: UDNResource | undefined): UseUDNVirtualMachinesResult => {
  const [vms, vmsLoaded, vmsLoadError] = useK8sWatchResource<V1VirtualMachine[]>({
    groupVersionKind: modelToGroupVersionKind(VirtualMachineModel),
    isList: true,
  });

  const [nads, nadsLoaded, nadsLoadError] = useK8sWatchResource<NetworkAttachmentDefinitionKind[]>({
    groupVersionKind: modelToGroupVersionKind(NetworkAttachmentDefinitionModel),
    isList: true,
  });

  const getNADForVM = useCallback(
    (vm: V1VirtualMachine) => (udn ? findNADForUDN(nads, udn, vm) : undefined),
    [nads, udn],
  );

  const virtualMachines = useMemo(() => getUDNVirtualMachines(vms, udn, nads), [nads, udn, vms]);

  const availableVirtualMachines = useMemo(
    () => (vms ?? []).filter((vm) => !vmUsesUDN(vm, udn)),
    [udn, vms],
  );

  return {
    availableVirtualMachines,
    getNADForVM,
    loaded: vmsLoaded && nadsLoaded,
    loadError: vmsLoadError || nadsLoadError,
    virtualMachines,
  };
};

export default useUDNVirtualMachines;
