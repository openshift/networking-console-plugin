import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { generateName } from '@utils/utils';

export const CLUSTER_NETWORK_CONFIG_NAME = 'cluster';
export const OVN_K8S = 'OVNKubernetes';

export const NetworkConfigModel: K8sModel = {
  abbr: 'NO',
  apiGroup: 'operator.openshift.io',
  apiVersion: 'v1',
  crd: true,
  id: 'network',
  kind: 'Network',
  label: 'Network',
  labelPlural: 'Networks',
  namespaced: false,
  plural: 'networks',
};

export const generateDefaultNAD = (namespace?: string) => ({
  apiVersion: `${NetworkAttachmentDefinitionModel.apiGroup}/${NetworkAttachmentDefinitionModel.apiVersion}`,
  kind: NetworkAttachmentDefinitionModel.kind,
  metadata: {
    name: generateName('nad'),
    ...(namespace && { namespace }),
  },
  spec: {
    config: '{}',
  },
});

export const DEFAULT_MTU = 1500;
