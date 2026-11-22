import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import { getAnnotations, getNamespace } from '@utils/resources/shared';
import { getNetworks } from '@utils/resources/vm/selectors';

import { POD_NETWORKS_ANNOTATION_KEY } from '../constants';
import {
  MultusNetworkReference,
  NetworkAttachmentDefinitionConfig,
  NetworkAttachmentDefinitionKind,
} from '../types';

export const getConfigAsJSON = (
  obj: NetworkAttachmentDefinitionKind,
): NetworkAttachmentDefinitionConfig => {
  try {
    return JSON.parse(obj?.spec?.config);
  } catch {
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

export type PodNetworkAttachment = {
  interfaceName?: string;
  name: string;
  namespace?: string;
};

/** Parses a Pod's Multus annotation into network name, optional namespace, and interface name. */
export const getPodNetworkAttachmentDetails = (pod: IoK8sApiCoreV1Pod): PodNetworkAttachment[] => {
  const annotation = getAnnotations(pod)?.[POD_NETWORKS_ANNOTATION_KEY]?.trim();
  if (!annotation) return [];

  if (annotation.startsWith('[')) {
    try {
      const references = JSON.parse(annotation) as MultusNetworkReference[];
      return references.flatMap(({ interface: interfaceName, name, namespace }) =>
        name ? [{ interfaceName, name, namespace }] : [],
      );
    } catch {
      return [];
    }
  }

  return annotation.split(',').flatMap((reference) => {
    const [name, interfaceName] = reference.trim().split('@');
    return name ? [{ interfaceName, name }] : [];
  });
};

export const getPodNetworkAttachments = (pod: IoK8sApiCoreV1Pod): string[] =>
  getPodNetworkAttachmentDetails(pod).map(({ name, namespace }) =>
    namespace ? `${namespace}/${name}` : name,
  );

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
