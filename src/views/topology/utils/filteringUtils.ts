import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import { getPodNADReferences, getPodNetworkAttachments } from '@utils/resources/nads/selectors';
import {
  VIRT_LAUNCHER_POD_LABEL_KEY,
  VIRT_LAUNCHER_POD_LABEL_VALUE,
} from '@utils/resources/pods/constants';
import { getLabels, getNamespace } from '@utils/resources/shared';
import { getUDNNADNameCandidates, isClusterUDN, UDNResource } from '@utils/resources/udns/helper';
import { getInterfaces, getNetworks } from '@utils/resources/vm/selectors';
import { L2_BRIDGE_BINDING_NAME } from '@views/topology/utils/constants';

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
