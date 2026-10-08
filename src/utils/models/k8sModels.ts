import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';

const NS = 'plugin__networking-console-plugin';

export const ServiceModel: K8sModel = {
  abbr: 'S',
  apiVersion: 'v1',
  id: 'service',
  kind: 'Service',
  label: 'Service',
  labelKey: `${NS}~Service`,
  labelPlural: 'Services',
  labelPluralKey: `${NS}~Services`,
  namespaced: true,
  plural: 'services',
};

export const PodModel: K8sModel = {
  abbr: 'P',
  apiVersion: 'v1',
  id: 'pod',
  kind: 'Pod',
  label: 'Pod',
  labelKey: `${NS}~Pod`,
  labelPlural: 'Pods',
  labelPluralKey: `${NS}~Pods`,
  namespaced: true,
  plural: 'pods',
};

export const NamespaceModel: K8sModel = {
  abbr: 'NS',
  apiVersion: 'v1',
  id: 'namespace',
  kind: 'Namespace',
  label: 'Namespace',
  labelKey: `${NS}~Namespace`,
  labelPlural: 'Namespaces',
  labelPluralKey: `${NS}~Namespaces`,
  plural: 'namespaces',
};

export const ProjectModel: K8sModel = {
  abbr: 'PR',
  apiGroup: 'project.openshift.io',
  apiVersion: 'v1',
  id: 'project',
  kind: 'Project',
  label: 'Project',
  labelKey: `${NS}~Project`,
  labelPlural: 'Projects',
  labelPluralKey: `${NS}~Projects`,
  plural: 'projects',
};

export const ProjectRequestModel: K8sModel = {
  abbr: '',
  apiGroup: 'project.openshift.io',
  apiVersion: 'v1',
  id: 'projectrequest',
  kind: 'ProjectRequest',
  label: 'ProjectRequest',
  labelKey: `${NS}~ProjectRequest`,
  labelPlural: 'ProjectRequests',
  labelPluralKey: `${NS}~ProjectRequests`,
  plural: 'projectrequests',
};

export const IngressModel: K8sModel = {
  abbr: 'I',
  apiGroup: 'networking.k8s.io',
  apiVersion: 'v1',
  id: 'ingress',
  kind: 'Ingress',
  label: 'Ingress',
  labelKey: `${NS}~Ingress`,
  labelPlural: 'Ingresses',
  labelPluralKey: `${NS}~Ingresses`,
  namespaced: true,
  plural: 'ingresses',
};

export const RouteModel: K8sModel = {
  abbr: 'RT',
  apiGroup: 'route.openshift.io',
  apiVersion: 'v1',
  id: 'route',
  kind: 'Route',
  label: 'Route',
  labelKey: `${NS}~Route`,
  labelPlural: 'Routes',
  labelPluralKey: `${NS}~Routes`,
  namespaced: true,
  plural: 'routes',
};

export const ConfigMapModel: K8sModel = {
  abbr: 'CM',
  apiVersion: 'v1',
  id: 'configmap',
  kind: 'ConfigMap',
  label: 'ConfigMap',
  labelKey: `${NS}~ConfigMap`,
  labelPlural: 'ConfigMaps',
  labelPluralKey: `${NS}~ConfigMaps`,
  namespaced: true,
  plural: 'configmaps',
};

export const NetworkPolicyModel: K8sModel = {
  abbr: 'NP',
  apiGroup: 'networking.k8s.io',
  apiVersion: 'v1',
  id: 'networkpolicy',
  kind: 'NetworkPolicy',
  label: 'NetworkPolicy',
  labelKey: `${NS}~NetworkPolicy`,
  labelPlural: 'NetworkPolicies',
  labelPluralKey: `${NS}~NetworkPolicies`,
  namespaced: true,
  plural: 'networkpolicies',
};

export const NetworkAttachmentDefinitionModel: K8sModel = {
  abbr: 'NAD',
  apiGroup: 'k8s.cni.cncf.io',
  apiVersion: 'v1',
  crd: true,
  id: 'network-attachment-definition',
  kind: 'NetworkAttachmentDefinition',
  label: 'Network Attachment Definition',
  labelKey: `${NS}~Network Attachment Definition`,
  labelPlural: 'Network Attachment Definitions',
  labelPluralKey: `${NS}~Network Attachment Definitions`,
  legacyPluralURL: true,
  namespaced: true,
  plural: 'network-attachment-definitions',
};

export const SriovNetworkNodePolicyModel: K8sModel = {
  abbr: 'SRNNPM',
  apiGroup: 'sriovnetwork.openshift.io',
  apiVersion: 'v1',
  crd: true,
  id: 'sriov-network-node-policy',
  kind: 'SriovNetworkNodePolicy',
  label: 'SriovNetworkNodePolicy',
  labelKey: `${NS}~SriovNetworkNodePolicy`,
  labelPlural: 'SriovNetworkNodePolicies',
  labelPluralKey: `${NS}~SriovNetworkNodePolicies`,
  namespaced: true,
  plural: 'sriovnetworknodepolicies',
};

export const SecretModel: K8sModel = {
  abbr: 'S',
  apiVersion: 'v1',
  id: 'secret',
  kind: 'Secret',
  label: 'Secret',
  labelKey: `${NS}~Secret`,
  labelPlural: 'Secrets',
  labelPluralKey: `${NS}~Secrets`,
  namespaced: true,
  plural: 'secrets',
};

export const HyperConvergedModel: K8sModel = {
  abbr: 'HC',
  apiGroup: 'hco.kubevirt.io',
  apiVersion: 'v1beta1',
  crd: true,
  kind: 'HyperConverged',
  label: 'HyperConverged',
  labelKey: `${NS}~HyperConverged`,
  labelPlural: 'HyperConvergeds',
  labelPluralKey: `${NS}~HyperConvergeds`,
  namespaced: true,
  plural: 'hyperconvergeds',
};
