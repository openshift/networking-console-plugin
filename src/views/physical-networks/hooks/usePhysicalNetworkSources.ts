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

  const nads = useK8sWatchResource<NetworkAttachmentDefinitionKind[]>({
    groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
    isList: true,
    namespace: scope,
    optional: true,
  });

  const pods = useK8sWatchResource<IoK8sApiCoreV1Pod[]>({
    groupVersionKind: modelToGroupVersionKind(PodModel),
    isList: true,
    namespace: scope,
    optional: true,
  });

  const virtualMachines = useK8sWatchResource<V1VirtualMachine[]>(
    kubevirtEnabled
      ? {
          groupVersionKind: modelToGroupVersionKind(VirtualMachineModel),
          isList: true,
          namespace: scope,
          optional: true,
        }
      : null,
  );

  const nncps = useK8sWatchResource<V1NodeNetworkConfigurationPolicy[]>({
    groupVersionKind: NodeNetworkConfigurationPolicyModelGroupVersionKind,
    isList: true,
    optional: true,
  });

  const nnces = useK8sWatchResource<V1beta1NodeNetworkConfigurationEnactment[]>({
    groupVersionKind: NodeNetworkConfigurationEnactmentModelGroupVersionKind,
    isList: true,
    optional: true,
  });

  const nodeNetworkStates = useK8sWatchResource<NodeNetworkStateKind[]>({
    groupVersionKind: NodeNetworkStateModelGroupVersionKind,
    isList: true,
    optional: true,
  });

  const nodes = useK8sWatchResource<IoK8sApiCoreV1Node[]>({
    groupVersionKind: NodeModelGroupVersionKind,
    isList: true,
    optional: true,
  });

  return {
    nads: getSourceState<NetworkAttachmentDefinitionKind>({
      data: nads[0],
      loaded: nads[1],
      loadError: nads[2],
    }),
    nnces: getSourceState<V1beta1NodeNetworkConfigurationEnactment>({
      data: nnces[0],
      loaded: nnces[1],
      loadError: nnces[2],
    }),
    nncps: getSourceState<V1NodeNetworkConfigurationPolicy>({
      data: nncps[0],
      loaded: nncps[1],
      loadError: nncps[2],
    }),
    nodeNetworkStates: getSourceState<NodeNetworkStateKind>({
      data: nodeNetworkStates[0],
      loaded: nodeNetworkStates[1],
      loadError: nodeNetworkStates[2],
    }),
    nodes: getSourceState<IoK8sApiCoreV1Node>({
      data: nodes[0],
      loaded: nodes[1],
      loadError: nodes[2],
    }),
    pods: getSourceState<IoK8sApiCoreV1Pod>({ data: pods[0], loaded: pods[1], loadError: pods[2] }),
    virtualMachines: kubevirtEnabled
      ? getSourceState<V1VirtualMachine>({
          data: virtualMachines[0],
          loaded: virtualMachines[1],
          loadError: virtualMachines[2],
        })
      : { availability: SourceAvailability.Absent, data: [] },
  };
};

export default usePhysicalNetworkSources;
