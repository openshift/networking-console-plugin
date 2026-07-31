import { useCallback, useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { UDNResource } from '@utils/resources/udns/helper';
import { findNADForUDN } from '@utils/resources/vm/utils';

import { getUDNVirtualMachines, UDNVirtualMachine, vmUsesUDN } from './utils/utils';

export type { UDNVirtualMachine };

type UseUDNVirtualMachines = {
  availableVirtualMachines: V1VirtualMachine[];
  getNADForVM: (vm: V1VirtualMachine) => NetworkAttachmentDefinitionKind | undefined;
  loaded: boolean;
  loadError: unknown;
  virtualMachines: UDNVirtualMachine[];
};

const useUDNVirtualMachines = (udn: UDNResource | undefined): UseUDNVirtualMachines => {
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
