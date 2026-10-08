export * from './k8sModels';
export * from './network-policy';

import { getGroupVersionKindForModel } from '@openshift-console/dynamic-plugin-sdk';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '@utils/resources/shared';

export { getGroupVersionKindForModel } from '@openshift-console/dynamic-plugin-sdk';
export { getReferenceForModel } from '@utils/resources/shared';

export const QuickStartModel: K8sModel = {
  abbr: 'CQS',
  apiGroup: 'console.openshift.io',
  apiVersion: 'v1',
  crd: true,
  kind: 'ConsoleQuickStart',
  label: 'ConsoleQuickStart',
  labelPlural: 'ConsoleQuickStarts',
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
  labelPlural: 'EndpointSlices',
  namespaced: true,
  plural: 'endpointslices',
};

export const MultiNetworkPolicyModel: K8sModel = {
  abbr: 'MNP',
  apiGroup: 'k8s.cni.cncf.io',
  apiVersion: 'v1beta1',
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
  getGroupVersionKindForModel(UserDefinedNetworkModel);
export const UserDefinedNetworkModelRef = getReferenceForModel(UserDefinedNetworkModel);

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

export const ClusterUserDefinedNetworkModelGroupVersionKind = getGroupVersionKindForModel(
  ClusterUserDefinedNetworkModel,
);
export const ClusterUserDefinedNetworkModelRef = getReferenceForModel(
  ClusterUserDefinedNetworkModel,
);

export const NetworkAttachmentDefinitionModelGroupVersionKind = getGroupVersionKindForModel(
  // Avoid circular: import directly
  {
    abbr: 'NAD',
    apiGroup: 'k8s.cni.cncf.io',
    apiVersion: 'v1',
    kind: 'NetworkAttachmentDefinition',
    label: 'Network Attachment Definition',
    labelPlural: 'Network Attachment Definitions',
    plural: 'network-attachment-definitions',
  },
);

export const NetworkAttachmentDefinitionModelRef = getReferenceForModel({
  abbr: 'NAD',
  apiGroup: 'k8s.cni.cncf.io',
  apiVersion: 'v1',
  kind: 'NetworkAttachmentDefinition',
  label: 'Network Attachment Definition',
  labelPlural: 'Network Attachment Definitions',
  plural: 'network-attachment-definitions',
});

export const SriovNetworkNodePolicyModelRef = getReferenceForModel({
  abbr: 'SRNNPM',
  apiGroup: 'sriovnetwork.openshift.io',
  apiVersion: 'v1',
  kind: 'SriovNetworkNodePolicy',
  label: 'SriovNetworkNodePolicy',
  labelPlural: 'SriovNetworkNodePolicies',
  plural: 'sriovnetworknodepolicies',
});

export const HyperConvergedModelRef = getReferenceForModel({
  abbr: 'HC',
  apiGroup: 'hco.kubevirt.io',
  apiVersion: 'v1beta1',
  kind: 'HyperConverged',
  label: 'HyperConverged',
  labelPlural: 'HyperConvergeds',
  plural: 'hyperconvergeds',
});
