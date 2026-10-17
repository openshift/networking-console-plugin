import { useMemo } from 'react';

import { IngressModel, modelToGroupVersionKind, PodModel } from '@kubevirt-ui/kubevirt-api/console';
import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import {
  IoK8sApiCoreV1Pod,
  IoK8sApiCoreV1Service,
  IoK8sApiNetworkingV1Ingress,
  IoK8sApiNetworkingV1NetworkPolicy,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { useActiveNamespace, useK8sWatchResources } from '@openshift-console/dynamic-plugin-sdk';
import { ALL_NAMESPACES_KEY } from '@utils/constants';
import {
  ClusterUserDefinedNetworkModelGroupVersionKind,
  UserDefinedNetworkModelGroupVersionKind,
} from '@utils/models';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { RouteKind } from '@utils/types';
import {
  podHasSecondaryNetworks,
  vmHasSecondaryNetworks,
} from '@views/topology/utils/filteringUtils';

export type NetworkTopologyResources = {
  clusterUserDefinedNetworks: ClusterUserDefinedNetworkKind[];
  ingresses: IoK8sApiNetworkingV1Ingress[];
  multiNetworkPolicies: IoK8sApiNetworkingV1NetworkPolicy[];
  networkAttachmentDefinitions: NetworkAttachmentDefinitionKind[];
  networkPolicies: IoK8sApiNetworkingV1NetworkPolicy[];
  pods: IoK8sApiCoreV1Pod[];
  routes: RouteKind[];
  services: IoK8sApiCoreV1Service[];
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
    // multiNetworkPolicies: {
    //   groupVersionKind: modelToGroupVersionKind(MultiNetworkPolicyModel),
    //   isList: true,
    //   ...namespaceProperties,
    // },
    networkAttachmentDefinitions: {
      groupVersionKind: modelToGroupVersionKind(NetworkAttachmentDefinitionModel),
      isList: true,
      ...namespaceProperties,
    },
    // networkPolicies: {
    //   groupVersionKind: modelToGroupVersionKind(NetworkPolicyModel),
    //   isList: true,
    //   ...namespaceProperties,
    // },
    pods: {
      groupVersionKind: modelToGroupVersionKind(PodModel),
      isList: true,
      ...namespaceProperties,
    },
    // routes: {
    //   groupVersionKind: modelToGroupVersionKind(RouteModel),
    //   isList: true,
    //   ...namespaceProperties,
    // },
    // services: {
    //   groupVersionKind: modelToGroupVersionKind(ServiceModel),
    //   isList: true,
    //   namespace: activeNamespace,
    //   namespaced: true,
    // },
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

  const loaded = Object.values(watchedResources).every((resource) => resource.loaded);
  const loadError = Object.values(watchedResources).find(
    (resource) => resource.loadError?.loadError,
  );

  const filteredPods = useMemo(() => {
    const pods = (watchedResources.pods.data || []) as IoK8sApiCoreV1Pod[];
    return pods.filter(podHasSecondaryNetworks);
  }, [watchedResources.pods.data]);

  const filteredVMs = useMemo(() => {
    const vms = (watchedResources.virtualMachines.data || []) as V1VirtualMachine[];
    return vms.filter(vmHasSecondaryNetworks);
  }, [watchedResources.virtualMachines.data]);

  const resources: NetworkTopologyResources = {
    clusterUserDefinedNetworks: watchedResources.clusterUserDefinedNetworks
      .data as ClusterUserDefinedNetworkKind[],
    ingresses: watchedResources.ingresses.data as IoK8sApiNetworkingV1Ingress[],
    // multiNetworkPolicies: watchedResources.multiNetworkPolicies
    //   .data as IoK8sApiNetworkingV1NetworkPolicy[],
    multiNetworkPolicies: [],
    networkAttachmentDefinitions: watchedResources.networkAttachmentDefinitions
      .data as NetworkAttachmentDefinitionKind[],
    // networkPolicies: watchedResources.networkPolicies.data as IoK8sApiNetworkingV1NetworkPolicy[],
    networkPolicies: [],
    pods: filteredPods,
    // routes: watchedResources.routes.data as RouteKind[],
    routes: [],
    // services: watchedResources.services.data as IoK8sApiCoreV1Service[],
    services: [],
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
