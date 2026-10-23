import { IoK8sApiCoreV1Pod } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import {
  VIRT_LAUNCHER_POD_LABEL_KEY,
  VIRT_LAUNCHER_POD_LABEL_VALUE,
} from '@utils/resources/pods/constants';
import { getAnnotations, getLabels, getNamespace } from '@utils/resources/shared';
import { getUDNNADNameCandidates, isClusterUDN, UDNResource } from '@utils/resources/udns/helper';
import { getInterfaces, getNetworks } from '@utils/resources/vm/selectors';
import { L2_BRIDGE_BINDING_NAME } from '@views/topology/utils/constants';

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

export const podHasSecondaryNetworks = (pod: IoK8sApiCoreV1Pod): boolean =>
  getPodNetworkAttachments(pod).length > 0;

export const isVirtLauncherPod = (pod: IoK8sApiCoreV1Pod): boolean =>
  getLabels(pod)?.[VIRT_LAUNCHER_POD_LABEL_KEY] === VIRT_LAUNCHER_POD_LABEL_VALUE;

export const vmHasSecondaryNetworks = (vm: V1VirtualMachine): boolean => {
  // TODO Check logic
  // const networks = getNetworks(vm);
  // return networks.some((network) => network.multus?.networkName);
  const interfaces = getInterfaces(vm);
  return (
    interfaces?.some((iface) => iface?.binding?.name === L2_BRIDGE_BINDING_NAME) ||
    getNetworks(vm)?.length > 1
  );
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

/**
 * Check if a Pod uses a UDN or ClusterUDN
 */
export const podUsesUDN = (pod: IoK8sApiCoreV1Pod, udn: UDNResource): boolean => {
  const udnNamespace = getNamespace(udn);
  const nadCandidates = getUDNNADNameCandidates(udn);
  const podNADRefs = getPodNADReferences(pod);

  return podNADRefs.some((nadRef) => {
    const [refNamespace, refName] = nadRef.split('/');

    if (!nadCandidates.includes(refName)) {
      return false;
    }

    if (isClusterUDN(udn)) {
      return true;
    }

    return refNamespace === udnNamespace;
  });
};
