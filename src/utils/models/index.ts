export * from './network-policy';
import { modelToGroupVersionKind, modelToRef } from '@kubevirt-ui-ext/kubevirt-api/console';
import type { K8sModel } from '@openshift-console/dynamic-plugin-sdk';

export const QuickStartModel: K8sModel = {
  abbr: 'CQS',
  apiGroup: 'console.openshift.io',
  apiVersion: 'v1',
  crd: true,
  kind: 'ConsoleQuickStart',
  label: 'ConsoleQuickStart',
  // t('ConsoleQuickStart')
  labelKey: 'ConsoleQuickStart',
  labelPlural: 'ConsoleQuickStarts',
  // t('ConsoleQuickStarts')
  labelPluralKey: 'ConsoleQuickStarts',
  namespaced: false,
  plural: 'consolequickstarts',
  propagationPolicy: 'Background',
};

export const EndPointSliceModel: K8sModel = {
  abbr: 'EPS',
  apiGroup: 'discovery.k8s.io',
  apiVersion: 'v1',
  kind: 'EndpointSlice',
  label: 'EndpointSlice',
  // t('EndpointSlice')
  labelKey: 'EndpointSlice',
  labelPlural: 'EndpointSlices',
  // t('EndpointSlices')
  labelPluralKey: 'EndpointSlices',
  namespaced: true,
  plural: 'endpointslices',
};

export const MultiNetworkPolicyModel: K8sModel = {
  abbr: 'MNP',
  apiGroup: 'k8s.cni.cncf.io',
  apiVersion: 'v1beta1',
  crd: true,
  id: 'multinetworkpolicy',
  kind: 'MultiNetworkPolicy',
  label: 'multi-networkpolicy',
  // t('multi-networkpolicy')
  labelKey: 'multi-networkpolicy',
  labelPlural: 'MultiNetworkPolicies',
  // t('multi-networkpolicies')
  labelPluralKey: 'multi-networkpolicies',
  namespaced: true,
  plural: 'multi-networkpolicies',
};

export const NetworkOperatorModel: K8sModel = {
  abbr: 'N',
  apiGroup: 'operator.openshift.io',
  apiVersion: 'v1',
  id: 'Network',
  kind: 'Network',
  label: 'network',
  // t('plugin__networking-console-plugin~network')
  labelKey: 'network',
  labelPlural: 'Networks',
  // t('plugin__networking-console-plugin~networks')
  labelPluralKey: 'networks',
  namespaced: false,
  plural: 'networks',
};

export const UserDefinedNetworkModel: K8sModel = {
  abbr: 'UDN',
  apiGroup: 'k8s.ovn.org',
  apiVersion: 'v1',
  crd: true,
  id: 'userdefinednetwork',
  kind: 'UserDefinedNetwork',
  label: 'userdefinednetwork',
  // t('plugin__networking-console-plugin~UserDefinedNetwork')
  labelKey: 'UserDefinedNetwork',
  labelPlural: 'UserDefinedNetworks',
  // t('plugin__networking-console-plugin~UserDefinedNetworks')
  labelPluralKey: 'UserDefinedNetworks',
  namespaced: true,
  plural: 'userdefinednetworks',
};

export const UserDefinedNetworkModelGroupVersionKind =
  modelToGroupVersionKind(UserDefinedNetworkModel);
export const UserDefinedNetworkModelRef = modelToRef(UserDefinedNetworkModel);

export const ClusterUserDefinedNetworkModel: K8sModel = {
  abbr: 'CUDN',
  apiGroup: 'k8s.ovn.org',
  apiVersion: 'v1',
  crd: true,
  id: 'clusteruserdefinednetwork',
  kind: 'ClusterUserDefinedNetwork',
  label: 'clusteruserdefinednetwork',
  // t('plugin__networking-console-plugin~ClusterUserDefinedNetwork')
  labelKey: 'ClusterUserDefinedNetwork',
  labelPlural: 'ClusterUserDefinedNetworks',
  // t('plugin__networking-console-plugin~ClusterUserDefinedNetworks')
  labelPluralKey: 'ClusterUserDefinedNetworks',
  namespaced: false,
  plural: 'clusteruserdefinednetworks',
};

export const ClusterUserDefinedNetworkModelGroupVersionKind = modelToGroupVersionKind(
  ClusterUserDefinedNetworkModel,
);
export const ClusterUserDefinedNetworkModelRef = modelToRef(ClusterUserDefinedNetworkModel);

export const BGPCloudConfigurationModel: K8sModel = {
  abbr: 'BGPCC',
  apiGroup: 'networking.openshift.io',
  apiVersion: 'v1beta1',
  crd: true,
  id: 'bgpcloudconfiguration',
  kind: 'BGPCloudConfiguration',
  label: 'BGPCloudConfiguration',
  labelKey: 'BGPCloudConfiguration',
  labelPlural: 'BGPCloudConfigurations',
  labelPluralKey: 'BGPCloudConfigurations',
  namespaced: false,
  plural: 'bgpcloudconfigurations',
};
export const BGPCloudConfigurationModelGroupVersionKind = modelToGroupVersionKind(
  BGPCloudConfigurationModel,
);

export const BGPRoutingModel: K8sModel = {
  abbr: 'BGPR',
  apiGroup: 'networking.openshift.io',
  apiVersion: 'v1beta1',
  crd: true,
  id: 'bgprouting',
  kind: 'BGPRouting',
  label: 'BGPRouting',
  labelKey: 'BGPRouting',
  labelPlural: 'BGPRoutings',
  labelPluralKey: 'BGPRoutings',
  namespaced: false,
  plural: 'bgproutings',
};
export const BGPRoutingModelGroupVersionKind = modelToGroupVersionKind(BGPRoutingModel);

export const FRRConfigurationModel: K8sModel = {
  abbr: 'FRRC',
  apiGroup: 'frrk8s.metallb.io',
  apiVersion: 'v1beta1',
  crd: true,
  id: 'frrconfiguration',
  kind: 'FRRConfiguration',
  label: 'FRRConfiguration',
  labelKey: 'FRRConfiguration',
  labelPlural: 'FRRConfigurations',
  labelPluralKey: 'FRRConfigurations',
  namespaced: true,
  plural: 'frrconfigurations',
};

export const RouteAdvertisementsModel: K8sModel = {
  abbr: 'RA',
  apiGroup: 'k8s.ovn.org',
  apiVersion: 'v1',
  crd: true,
  id: 'routeadvertisements',
  kind: 'RouteAdvertisements',
  label: 'RouteAdvertisements',
  labelKey: 'RouteAdvertisements',
  labelPlural: 'RouteAdvertisements',
  labelPluralKey: 'RouteAdvertisements',
  namespaced: false,
  plural: 'routeadvertisements',
};

const NodeNetworkConfigurationPolicyModel: K8sModel = {
  abbr: 'NNCP',
  apiGroup: 'nmstate.io',
  apiVersion: 'v1',
  crd: true,
  id: 'NodeNetworkConfigurationPolicy',
  kind: 'NodeNetworkConfigurationPolicy',
  // t('NodeNetworkConfigurationPolicy')
  label: 'NodeNetworkConfigurationPolicy',
  labelPlural: 'NodeNetworkConfigurationPolicies',
  namespaced: false,
  plural: 'nodenetworkconfigurationpolicies',
};

export const NodeNetworkConfigurationPolicyModelGroupVersionKind = modelToGroupVersionKind(
  NodeNetworkConfigurationPolicyModel,
);

const NodeNetworkStateModel: K8sModel = {
  abbr: 'NNS',
  apiGroup: 'nmstate.io',
  apiVersion: 'v1beta1',
  crd: true,
  id: 'NodeNetworkState',
  kind: 'NodeNetworkState',
  label: 'NodeNetworkState',
  labelPlural: 'NodeNetworkStates',
  namespaced: false,
  plural: 'nodenetworkstates',
};

export const NodeNetworkStateModelGroupVersionKind = modelToGroupVersionKind(NodeNetworkStateModel);

export const IngressModel: K8sModel = {
  abbr: 'I',
  apiGroup: 'networking.k8s.io',
  apiVersion: 'v1',
  id: 'ingress',
  kind: 'Ingress',
  label: 'Ingress',
  // t('Ingress')
  labelKey: 'Ingress',
  labelPlural: 'Ingresses',
  // t('Ingresses')
  labelPluralKey: 'Ingresses',
  namespaced: true,
  plural: 'ingresses',
};
