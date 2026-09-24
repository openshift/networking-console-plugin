import { useMemo } from 'react';

import {
  modelToGroupVersionKind,
  NetworkAttachmentDefinitionModel,
  PodModel,
  VirtualMachineModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import {
  K8sResourceCommon,
  useActiveNamespace,
  useK8sWatchResources,
} from '@openshift-console/dynamic-plugin-sdk';
import { ALL_NAMESPACES_KEY } from '@utils/constants';
import useProjects from '@utils/hooks/useProjects/useProjects';
import {
  ClusterUserDefinedNetworkModelGroupVersionKind,
  IngressModel,
  UserDefinedNetworkModelGroupVersionKind,
} from '@utils/models';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import {
  isVirtLauncherPod,
  podHasSecondaryNetworks,
  vmHasSecondaryNetworks,
} from '@views/topology/utils/filteringUtils';

export type NetworkTopologyResources = {
  clusterUserDefinedNetworks: ClusterUserDefinedNetworkKind[];
  networkAttachmentDefinitions: NetworkAttachmentDefinitionKind[];
  pods: IoK8sApiCoreV1Pod[];
  projects: K8sResourceCommon[];
  userDefinedNetworks: UserDefinedNetworkKind[];
  virtualMachines: V1VirtualMachine[];
};

type UseNetworkTopologyResourcesResult = {
  loaded: boolean;
  loadError: unknown;
  resources: NetworkTopologyResources;
};

const useNetworkTopologyResources = (): UseNetworkTopologyResourcesResult => {
  const [activeNamespace] = useActiveNamespace();
  const [projects, projectsLoaded] = useProjects();

  const namespaceProperties = {
    ...(activeNamespace !== ALL_NAMESPACES_KEY && { namespace: activeNamespace }),
    namespaced: activeNamespace !== ALL_NAMESPACES_KEY,
  };

  const watchedResources = useK8sWatchResources({
    clusterUserDefinedNetworks: {
      groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
      isList: true,
      ...namespaceProperties,
    },
    ingresses: {
      groupVersionKind: modelToGroupVersionKind(IngressModel),
      isList: true,
      ...namespaceProperties,
    },
    networkAttachmentDefinitions: {
      groupVersionKind: modelToGroupVersionKind(NetworkAttachmentDefinitionModel),
      isList: true,
      ...namespaceProperties,
    },
    pods: {
      groupVersionKind: modelToGroupVersionKind(PodModel),
      isList: true,
      ...namespaceProperties,
    },
    userDefinedNetworks: {
      groupVersionKind: UserDefinedNetworkModelGroupVersionKind,
      isList: true,
      ...namespaceProperties,
    },
    virtualMachines: {
      groupVersionKind: modelToGroupVersionKind(VirtualMachineModel),
      isList: true,
      ...namespaceProperties,
    },
  });

  const loaded =
    Object.values(watchedResources).every((resource) => resource.loaded) && projectsLoaded;
  const loadError = Object.values(watchedResources).find(
    (resource) => resource.loadError?.loadError,
  );

  const filteredPods = useMemo(() => {
    const pods = (watchedResources.pods.data || []) as IoK8sApiCoreV1Pod[];
    return pods.filter(podHasSecondaryNetworks).filter((pod) => !isVirtLauncherPod(pod));
  }, [watchedResources.pods.data]);

  const filteredVMs = useMemo(() => {
    const vms = (watchedResources.virtualMachines.data || []) as V1VirtualMachine[];
    return vms.filter(vmHasSecondaryNetworks);
  }, [watchedResources.virtualMachines.data]);

  const resources: NetworkTopologyResources = {
    clusterUserDefinedNetworks: watchedResources.clusterUserDefinedNetworks
      .data as ClusterUserDefinedNetworkKind[],
    networkAttachmentDefinitions: watchedResources.networkAttachmentDefinitions
      .data as NetworkAttachmentDefinitionKind[],
    pods: filteredPods,
    projects: projects || [],
    userDefinedNetworks: watchedResources.userDefinedNetworks.data as UserDefinedNetworkKind[],
    virtualMachines: filteredVMs,
  };

  return {
    loaded,
    loadError,
    resources,
  };
};

export default useNetworkTopologyResources;
