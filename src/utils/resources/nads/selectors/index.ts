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

type MultusNetworkReference = { name?: string; namespace?: string };

/**
 * Extract NAD names from a Pod's network annotation.
 * Multus accepts a comma-separated list, entries carrying an `@interface` suffix,
 * and a JSON list of `{ name, namespace }` objects; all become `name` or `namespace/name`.
 */
export const getPodNetworkAttachments = (pod: IoK8sApiCoreV1Pod): string[] => {
  const annotation = getAnnotations(pod)?.[POD_NETWORKS_ANNOTATION_KEY]?.trim();
  if (!annotation) return [];

  if (annotation.startsWith('[')) {
    try {
      const references = JSON.parse(annotation) as MultusNetworkReference[];
      return references.flatMap(({ name, namespace }) =>
        name ? [namespace ? `${namespace}/${name}` : name] : [],
      );
    } catch {
      return [];
    }
  }

  return annotation
    .split(',')
    .map((reference) => reference.trim().split('@')[0].trim())
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
