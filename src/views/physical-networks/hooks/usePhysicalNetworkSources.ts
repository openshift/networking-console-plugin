import { useMemo } from 'react';

import {
  modelToGroupVersionKind,
  NetworkAttachmentDefinitionModelGroupVersionKind,
  PodModel,
  VirtualMachineModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import type {
  IoK8sApiCoreV1Node,
  IoK8sApiCoreV1Pod,
} from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import type { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import {
  V1beta1NodeNetworkConfigurationEnactment,
  V1NodeNetworkConfigurationPolicy,
} from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { useFlag, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { FLAG_KUBEVIRT } from '@utils/flags/consts';
import {
  NodeModelGroupVersionKind,
  NodeNetworkConfigurationEnactmentModelGroupVersionKind,
  NodeNetworkConfigurationPolicyModelGroupVersionKind,
  NodeNetworkStateModelGroupVersionKind,
} from '@utils/models';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { NodeNetworkStateKind } from '@utils/resources/nmstate/types';

import { getSourceState } from '../utils/sourceStates';
import { PhysicalNetworksSources, SourceAvailability } from '../utils/types';

const usePhysicalNetworkSources = (scope: string | undefined): PhysicalNetworksSources => {
  const kubevirtEnabled = useFlag(FLAG_KUBEVIRT);

  const [nadsData, nadsLoaded, nadsError] = useK8sWatchResource<NetworkAttachmentDefinitionKind[]>({
    groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
    isList: true,
    namespace: scope,
    optional: true,
  });

  const [podsData, podsLoaded, podsError] = useK8sWatchResource<IoK8sApiCoreV1Pod[]>({
    groupVersionKind: modelToGroupVersionKind(PodModel),
    isList: true,
    namespace: scope,
    optional: true,
  });

  const [virtualMachinesData, virtualMachinesLoaded, virtualMachinesError] = useK8sWatchResource<
    V1VirtualMachine[]
  >(
    kubevirtEnabled
      ? {
          groupVersionKind: modelToGroupVersionKind(VirtualMachineModel),
          isList: true,
          namespace: scope,
          optional: true,
        }
      : null,
  );

  const [nncpsData, nncpsLoaded, nncpsError] = useK8sWatchResource<
    V1NodeNetworkConfigurationPolicy[]
  >({
    groupVersionKind: NodeNetworkConfigurationPolicyModelGroupVersionKind,
    isList: true,
    optional: true,
  });

  const [nncesData, nncesLoaded, nncesError] = useK8sWatchResource<
    V1beta1NodeNetworkConfigurationEnactment[]
  >({
    groupVersionKind: NodeNetworkConfigurationEnactmentModelGroupVersionKind,
    isList: true,
    optional: true,
  });

  const [nodeNetworkStatesData, nodeNetworkStatesLoaded, nodeNetworkStatesError] =
    useK8sWatchResource<NodeNetworkStateKind[]>({
      groupVersionKind: NodeNetworkStateModelGroupVersionKind,
      isList: true,
      optional: true,
    });

  const [nodesData, nodesLoaded, nodesError] = useK8sWatchResource<IoK8sApiCoreV1Node[]>({
    groupVersionKind: NodeModelGroupVersionKind,
    isList: true,
    optional: true,
  });

  return useMemo(
    () => ({
      nads: getSourceState<NetworkAttachmentDefinitionKind>({
        data: nadsData,
        loaded: nadsLoaded,
        loadError: nadsError,
      }),
      nnces: getSourceState<V1beta1NodeNetworkConfigurationEnactment>({
        data: nncesData,
        loaded: nncesLoaded,
        loadError: nncesError,
      }),
      nncps: getSourceState<V1NodeNetworkConfigurationPolicy>({
        data: nncpsData,
        loaded: nncpsLoaded,
        loadError: nncpsError,
      }),
      nodeNetworkStates: getSourceState<NodeNetworkStateKind>({
        data: nodeNetworkStatesData,
        loaded: nodeNetworkStatesLoaded,
        loadError: nodeNetworkStatesError,
      }),
      nodes: getSourceState<IoK8sApiCoreV1Node>({
        data: nodesData,
        loaded: nodesLoaded,
        loadError: nodesError,
      }),
      pods: getSourceState<IoK8sApiCoreV1Pod>({
        data: podsData,
        loaded: podsLoaded,
        loadError: podsError,
      }),
      virtualMachines: kubevirtEnabled
        ? getSourceState<V1VirtualMachine>({
            data: virtualMachinesData,
            loaded: virtualMachinesLoaded,
            loadError: virtualMachinesError,
          })
        : { availability: SourceAvailability.Absent, data: [] },
    }),
    [
      kubevirtEnabled,
      nadsData,
      nadsLoaded,
      nadsError,
      nncesData,
      nncesLoaded,
      nncesError,
      nncpsData,
      nncpsLoaded,
      nncpsError,
      nodeNetworkStatesData,
      nodeNetworkStatesLoaded,
      nodeNetworkStatesError,
      nodesData,
      nodesLoaded,
      nodesError,
      podsData,
      podsLoaded,
      podsError,
      virtualMachinesData,
      virtualMachinesLoaded,
      virtualMachinesError,
    ],
  );
};

export default usePhysicalNetworkSources;
