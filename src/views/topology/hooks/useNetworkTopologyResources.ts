import {
  IngressModel,
  modelToGroupVersionKind,
  NetworkPolicyModel,
  RouteModel,
  ServiceModel,
} from '@kubevirt-ui/kubevirt-api/console';
import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import {
  IoK8sApiCoreV1Service,
  IoK8sApiNetworkingV1Ingress,
  IoK8sApiNetworkingV1NetworkPolicy,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { useK8sWatchResources } from '@openshift-console/dynamic-plugin-sdk';
import {
  ClusterUserDefinedNetworkModelGroupVersionKind,
  MultiNetworkPolicyModel,
  UserDefinedNetworkModelGroupVersionKind,
} from '@utils/models';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { RouteKind } from '@utils/types';

export type NetworkTopologyResources = {
  clusterUserDefinedNetworks: ClusterUserDefinedNetworkKind[];
  ingresses: IoK8sApiNetworkingV1Ingress[];
  multiNetworkPolicies: IoK8sApiNetworkingV1NetworkPolicy[];
  networkAttachmentDefinitions: NetworkAttachmentDefinitionKind[];
  networkPolicies: IoK8sApiNetworkingV1NetworkPolicy[];
  routes: RouteKind[];
  services: IoK8sApiCoreV1Service[];
  userDefinedNetworks: UserDefinedNetworkKind[];
};

type UseNetworkTopologyResourcesResult = {
  loaded: boolean;
  loadError: unknown;
  resources: NetworkTopologyResources;
};

const useNetworkTopologyResources = (): UseNetworkTopologyResourcesResult => {
  const watchedResources = useK8sWatchResources({
    clusterUserDefinedNetworks: {
      groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
      isList: true,
      namespaced: false,
    },
    ingresses: {
      groupVersionKind: modelToGroupVersionKind(IngressModel),
      isList: true,
      namespaced: false,
    },
    multiNetworkPolicies: {
      groupVersionKind: modelToGroupVersionKind(MultiNetworkPolicyModel),
      isList: true,
      namespaced: false,
    },
    networkAttachmentDefinitions: {
      groupVersionKind: modelToGroupVersionKind(NetworkAttachmentDefinitionModel),
      isList: true,
      namespaced: false,
    },
    networkPolicies: {
      groupVersionKind: modelToGroupVersionKind(NetworkPolicyModel),
      isList: true,
      namespaced: false,
    },
    routes: {
      groupVersionKind: modelToGroupVersionKind(RouteModel),
      isList: true,
      namespaced: false,
    },
    services: {
      groupVersionKind: modelToGroupVersionKind(ServiceModel),
      isList: true,
      namespaced: false,
    },
    userDefinedNetworks: {
      groupVersionKind: UserDefinedNetworkModelGroupVersionKind,
      isList: true,
      namespaced: false,
    },
  });

  const loaded = Object.values(watchedResources).every((resource) => resource.loaded);
  const loadError = Object.values(watchedResources).find(
    (resource) => resource.loadError?.loadError,
  );

  const resources: NetworkTopologyResources = {
    clusterUserDefinedNetworks: watchedResources.clusterUserDefinedNetworks
      .data as ClusterUserDefinedNetworkKind[],
    ingresses: watchedResources.ingresses.data as IoK8sApiNetworkingV1Ingress[],
    multiNetworkPolicies: watchedResources.multiNetworkPolicies
      .data as IoK8sApiNetworkingV1NetworkPolicy[],
    networkAttachmentDefinitions: watchedResources.networkAttachmentDefinitions
      .data as NetworkAttachmentDefinitionKind[],
    networkPolicies: watchedResources.networkPolicies.data as IoK8sApiNetworkingV1NetworkPolicy[],
    routes: watchedResources.routes.data as RouteKind[],
    services: watchedResources.services.data as IoK8sApiCoreV1Service[],
    userDefinedNetworks: watchedResources.userDefinedNetworks.data as UserDefinedNetworkKind[],
  };

  return {
    loaded,
    loadError,
    resources,
  };
};

export default useNetworkTopologyResources;
