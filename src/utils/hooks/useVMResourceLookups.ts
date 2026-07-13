import { useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineClusterInstancetypeModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineClusterInstancetypeModel';
import VirtualMachineInstanceModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineInstanceModel';
import VirtualMachineInstancetypeModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineInstancetypeModel';
import {
  V1beta1VirtualMachineClusterInstancetype,
  V1beta1VirtualMachineInstancetype,
  V1VirtualMachineInstance,
} from '@kubevirt-ui/kubevirt-api/kubevirt';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { buildVMResourceLookups, VMResourceLookups } from '@utils/resources/vm/vmResourceLookups';

type UseVMResourceLookupsResult = {
  loaded: boolean;
  loadError: unknown;
  lookups: VMResourceLookups;
};

const useVMResourceLookups = (): UseVMResourceLookupsResult => {
  const [vmis, vmisLoaded, vmisLoadError] = useK8sWatchResource<V1VirtualMachineInstance[]>({
    groupVersionKind: modelToGroupVersionKind(VirtualMachineInstanceModel),
    isList: true,
  });

  const [clusterInstancetypes, clusterInstancetypesLoaded, clusterInstancetypesLoadError] =
    useK8sWatchResource<V1beta1VirtualMachineClusterInstancetype[]>({
      groupVersionKind: modelToGroupVersionKind(VirtualMachineClusterInstancetypeModel),
      isList: true,
    });

  const [namespacedInstancetypes, namespacedInstancetypesLoaded, namespacedInstancetypesLoadError] =
    useK8sWatchResource<V1beta1VirtualMachineInstancetype[]>({
      groupVersionKind: modelToGroupVersionKind(VirtualMachineInstancetypeModel),
      isList: true,
    });

  const lookups = useMemo(
    () => buildVMResourceLookups(vmis, clusterInstancetypes, namespacedInstancetypes),
    [clusterInstancetypes, namespacedInstancetypes, vmis],
  );

  return {
    loaded: vmisLoaded && clusterInstancetypesLoaded && namespacedInstancetypesLoaded,
    loadError: vmisLoadError || clusterInstancetypesLoadError || namespacedInstancetypesLoadError,
    lookups,
  };
};

export default useVMResourceLookups;
