import { useMemo } from 'react';

import {
  modelToGroupVersionKind,
  VirtualMachineClusterInstancetypeModel,
  VirtualMachineInstanceModel,
  VirtualMachineInstancetypeModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  V1beta1VirtualMachineClusterInstancetype,
  V1beta1VirtualMachineInstancetype,
  V1VirtualMachineInstance,
} from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
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
