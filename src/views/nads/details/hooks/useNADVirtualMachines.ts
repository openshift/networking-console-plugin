import { useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1Network, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getInterfaces, getNetworks } from '@utils/resources/vm/selectors';
import { multusNetworkMatchesNAD } from '@utils/resources/vm/utils';

export type NADVirtualMachine = {
  interfaceName: string;
  vm: V1VirtualMachine;
};

type UseNADVirtualMachinesResult = {
  availableVirtualMachines: V1VirtualMachine[];
  loaded: boolean;
  loadError: unknown;
  virtualMachines: NADVirtualMachine[];
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

  return iface?.state !== 'absent';
};

const getNADVirtualMachines = (
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

const useNADVirtualMachines = (
  nad: NetworkAttachmentDefinitionKind | undefined,
): UseNADVirtualMachinesResult => {
  const [vms, loaded, loadError] = useK8sWatchResource<V1VirtualMachine[]>({
    groupVersionKind: modelToGroupVersionKind(VirtualMachineModel),
    isList: true,
  });

  const virtualMachines = useMemo(() => getNADVirtualMachines(vms, nad), [vms, nad]);

  const availableVirtualMachines = useMemo(
    () => (vms ?? []).filter((vm) => !vmUsesNAD(vm, nad)),
    [vms, nad],
  );

  return { availableVirtualMachines, loaded, loadError, virtualMachines };
};

export default useNADVirtualMachines;
