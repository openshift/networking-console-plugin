import { useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';

import { getNADVirtualMachines, NADVirtualMachine, vmUsesNAD } from './utils/utils';

export type { NADVirtualMachine };

type UseNADVirtualMachines = {
  availableVirtualMachines: V1VirtualMachine[];
  loaded: boolean;
  loadError: unknown;
  virtualMachines: NADVirtualMachine[];
};

const useNADVirtualMachines = (
  nad: NetworkAttachmentDefinitionKind | undefined,
): UseNADVirtualMachines => {
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
