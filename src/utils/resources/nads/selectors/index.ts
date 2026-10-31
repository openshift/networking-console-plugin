import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import { getAnnotations, getNamespace } from '@utils/resources/shared';
import { getNetworks } from '@utils/resources/vm/selectors';

import { NetworkAttachmentDefinitionConfig, NetworkAttachmentDefinitionKind } from '../types';

export const getConfigAsJSON = (
  obj: NetworkAttachmentDefinitionKind,
): NetworkAttachmentDefinitionConfig => {
  try {
    return JSON.parse(obj?.spec?.config);
  } catch {
    // eslint-disable-next-line no-console
    console.error('Unable to parse NetworkAttachmentDefinition configuration');
    return null;
  }
};

export const getType = (config: NetworkAttachmentDefinitionConfig): string => {
  if (config?.type) {
    return config.type;
  }

  if (config?.plugins && Array.isArray(config.plugins) && config.plugins.length > 0) {
    return config.plugins[0]?.type || null;
  }

  return null;
};

export const POD_NETWORKS_ANNOTATION_KEY = 'k8s.v1.cni.cncf.io/networks';

/**
 * Extract NAD names from Pod's network annotation
 * Handles both simple names and namespace-qualified names
 */
export const getPodNetworkAttachments = (pod: IoK8sApiCoreV1Pod): string[] => {
  const annotation = getAnnotations(pod)?.[POD_NETWORKS_ANNOTATION_KEY];
  if (!annotation) return [];

  return annotation
    .split(',')
    .map((nad) => nad.trim())
    .filter(Boolean);
};

/**
 * Get all NAD names that a Pod connects to (normalized to namespace/name format)
 */
export const getPodNADReferences = (pod: IoK8sApiCoreV1Pod): string[] => {
  const podNamespace = getNamespace(pod);
  const attachments = getPodNetworkAttachments(pod);

  return attachments.map((attachment) => {
    if (attachment.includes('/')) {
      return attachment;
    }
    return `${podNamespace}/${attachment}`;
  });
};

/**
 * Get all NAD names that a VM connects to (normalized to namespace/name format)
 */
export const getVMNADReferences = (vm: V1VirtualMachine): string[] => {
  const vmNamespace = getNamespace(vm);
  const networks = getNetworks(vm);

  return networks
    .filter((network) => network.multus?.networkName)
    .map((network) => {
      const networkName = network.multus.networkName;
      if (networkName.includes('/')) {
        return networkName;
      }
      return `${vmNamespace}/${networkName}`;
    });
};
