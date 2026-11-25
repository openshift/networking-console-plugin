import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import {
  V1beta1NodeNetworkState,
  V1NodeNetworkConfigurationPolicy,
} from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import {
  getConfigAsJSON,
  getPodNetworkAttachmentDetails,
  getVMNADReferences,
} from '@utils/resources/nads/selectors';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getPolicyLocalnetNames } from '@utils/resources/nmstate/NodeNetworkConfigurationPolicies/selectors';
import { getName, getNamespace } from '@utils/resources/shared';
import { getCUDNNamespaceNames, isPrimaryUDN } from '@utils/resources/udns/helper';
import { getNetwork } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { getInterfaces, getNetworks } from '@utils/resources/vm/selectors';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';
import { ResourceType } from '@views/topology/utils/constants';
import { generateDataModel } from '@views/topology/utils/dataTransformation/dataTransformation';
import { getResourceID } from '@views/topology/utils/dataTransformation/resourceUtils';

import { WorkerBridgeAttachment, WorkloadAttachment } from './types';

const getNADBridge = (resource: NetworkAttachmentDefinitionKind): string | undefined => {
  const config = getConfigAsJSON(resource);
  const plugin = config?.plugins?.[0] || config;
  return plugin?.bridge;
};

const getNADPhysicalNetworkName = (
  resource: NetworkAttachmentDefinitionKind,
): string | undefined => {
  const config = getConfigAsJSON(resource);
  const plugin = config?.plugins?.[0] || config;
  return plugin?.physicalNetworkName;
};

export const getExpectedNetworkBridge = (
  resource: K8sResourceCommon,
  resourceType: ResourceType,
): string | undefined =>
  resourceType === ResourceType.NetworkAttachmentDefinition
    ? getNADBridge(resource as NetworkAttachmentDefinitionKind)
    : undefined;

export const getPhysicalNetworkName = (
  resource: K8sResourceCommon,
  resourceType: ResourceType,
): string | undefined => {
  if (resourceType === ResourceType.NetworkAttachmentDefinition) {
    return getNADPhysicalNetworkName(resource as NetworkAttachmentDefinitionKind);
  }

  const isUDN =
    resourceType === ResourceType.UserDefinedNetwork ||
    resourceType === ResourceType.ClusterUserDefinedNetwork;
  return isUDN
    ? getNetwork(resource as ClusterUserDefinedNetworkKind | UserDefinedNetworkKind)?.localnet
        ?.physicalNetworkName
    : undefined;
};

export const isHostManagedNetwork = (
  resource: K8sResourceCommon,
  resourceType: ResourceType,
): boolean => Boolean(getPhysicalNetworkName(resource, resourceType));

export const getWorkerBridgeAttachments = (
  physicalNetworkName: string | undefined,
  nodeNetworkStates: V1beta1NodeNetworkState[],
): WorkerBridgeAttachment[] => {
  if (!physicalNetworkName) return [];

  return nodeNetworkStates.flatMap((state) =>
    (state.status?.currentState?.ovn?.['bridge-mappings'] || [])
      .filter((mapping) => mapping.localnet === physicalNetworkName && mapping.state !== 'absent')
      .flatMap((mapping) =>
        mapping.bridge ? [{ bridge: mapping.bridge, nodeName: getName(state) }] : [],
      ),
  );
};

export const getNetworkPolicies = (
  physicalNetworkName: string | undefined,
  policies: V1NodeNetworkConfigurationPolicy[],
): V1NodeNetworkConfigurationPolicy[] =>
  physicalNetworkName
    ? policies.filter((policy) => getPolicyLocalnetNames(policy).includes(physicalNetworkName))
    : [];

const getNetworkAttachmentDefinition = (
  reference: string,
  nads: NetworkAttachmentDefinitionKind[],
): NetworkAttachmentDefinitionKind | undefined => {
  const [namespace, name] = reference.split('/');
  return nads.find((nad) => getNamespace(nad) === namespace && getName(nad) === name);
};

const getPodAttachmentReference = (
  name: string,
  namespace: string | undefined,
  podNamespace: string | undefined,
): string => {
  if (namespace) return `${namespace}/${name}`;

  return name.includes('/') ? name : `${podNamespace}/${name}`;
};

export const getWorkloadAttachments = (
  resource: K8sResourceCommon,
  resourceType: ResourceType.Pod | ResourceType.VirtualMachine,
  nads: NetworkAttachmentDefinitionKind[],
): WorkloadAttachment[] => {
  if (resourceType === ResourceType.Pod) {
    const pod = resource as IoK8sApiCoreV1Pod;
    const podNamespace = getNamespace(pod);
    return getPodNetworkAttachmentDetails(pod).map(({ interfaceName, name, namespace }) => {
      const reference = getPodAttachmentReference(name, namespace, podNamespace);
      return {
        interfaceName: interfaceName || '',
        nad: getNetworkAttachmentDefinition(reference, nads),
        reference,
      };
    });
  }

  const vm = resource as V1VirtualMachine;
  const interfaces = getInterfaces(vm);
  return getVMNADReferences(vm).map((reference) => {
    const network = getNetworks(vm).find((item) => {
      const networkName = item.multus?.networkName;
      return networkName === reference || networkName === reference.split('/')[1];
    });
    const vmInterface = interfaces.find((item) => item.name === network?.name);
    return {
      binding: vmInterface?.binding ? Object.keys(vmInterface.binding)[0] : undefined,
      interfaceName: vmInterface?.name || '',
      nad: getNetworkAttachmentDefinition(reference, nads),
      reference,
    };
  });
};

export const getWorkloadPrimaryNetwork = (
  resource: K8sResourceCommon,
  resources: NetworkTopologyResources,
): ClusterUserDefinedNetworkKind | undefined | UserDefinedNetworkKind => {
  const namespace = getNamespace(resource);
  const udn = resources.userDefinedNetworks.find(
    (network) => getNamespace(network) === namespace && isPrimaryUDN(network),
  );
  if (udn) return udn;

  return resources.clusterUserDefinedNetworks.find(
    (network) =>
      isPrimaryUDN(network) &&
      getCUDNNamespaceNames(network, resources.projects).includes(namespace),
  );
};

export const getConnectedResources = (
  resources: NetworkTopologyResources | undefined,
  selectedResource: K8sResourceCommon,
): K8sResourceCommon[] => {
  if (!resources) return [];

  const model = generateDataModel(resources);
  const resourceID = getResourceID(selectedResource);
  const connectedIDs = model.edges
    .filter((edge) => edge.source === resourceID || edge.target === resourceID)
    .map((edge) => (edge.source === resourceID ? edge.target : edge.source));

  return model.nodes
    .filter((node) => connectedIDs.includes(node.id))
    .map((node) => node.data.resource);
};
