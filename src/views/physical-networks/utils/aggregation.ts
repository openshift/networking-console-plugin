import { TFunction } from 'i18next';

import {
  modelToGroupVersionKind,
  PodModel,
  VirtualMachineModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import type {
  IoK8sApiCoreV1Node,
  IoK8sApiCoreV1Pod,
} from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import type { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import {
  V1beta1NodeNetworkConfigurationEnactment,
  V1NodeNetworkConfigurationPolicy,
} from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { getPodNADReferences, getVMNADReferences } from '@utils/resources/nads/selectors';
import {
  getAggregationMode,
  getEnactmentStateNNCP,
  getEnactmentStateNode,
  getEnactmentStatus,
  getMTU,
  getObservedBridgeMappings,
  getPolicyLocalnetNames,
  getUplinkDisplayText,
} from '@utils/resources/nmstate/selectors';
import type { NodeNetworkStateKind } from '@utils/resources/nmstate/types';
import { isVirtLauncherPod } from '@utils/resources/pods/selectors';
import {
  getAnnotations,
  getLabels,
  getName,
  getNamespace,
  getResourceURL,
} from '@utils/resources/shared';

import {
  ConfigurationDetails,
  ConfigurationDetailsMap,
  EnactmentState,
  LocalnetNAD,
  NNCPToNodeEnactmentStateMap,
  NodeToEnactmentStateMap,
  ObservedMapping,
  PhysicalNetwork,
  PhysicalNetworkConsumer,
} from './types';

// A policy without a node selector applies to every node it could run on, not to none.
const allLabelsMatchSelector = (
  selector: Record<string, string>,
  labels: Record<string, string>,
): boolean => {
  if (!selector || Object.keys(selector).length === 0) return true;
  if (!labels) return false;
  return Object.entries(selector).every(([key, value]) => labels[key] === value);
};

const filterNodes = (
  nodes: IoK8sApiCoreV1Node[],
  selector: Record<string, string>,
): IoK8sApiCoreV1Node[] =>
  nodes.filter((node) => allLabelsMatchSelector(selector, getLabels(node)));

const getConfigurationEnactmentState = (nodeToEnactmentStateMap: NodeToEnactmentStateMap) => {
  if (!nodeToEnactmentStateMap) return undefined;

  const enactmentStates = Object.values(nodeToEnactmentStateMap).map(
    (enactmentState) => enactmentState.status,
  );
  if (enactmentStates.includes(EnactmentState.Failing)) return EnactmentState.Failing;
  if (enactmentStates.includes(EnactmentState.Pending)) return EnactmentState.Pending;
  if (enactmentStates.includes(EnactmentState.Progressing)) return EnactmentState.Progressing;
  if (enactmentStates.includes(EnactmentState.Aborted)) return EnactmentState.Aborted;
  return EnactmentState.Available;
};

const getNodeByName = (name: string, nodes: IoK8sApiCoreV1Node[]) =>
  nodes.find((node) => getName(node) === name);

const getEnactmentStateMap = (
  nnces: V1beta1NodeNetworkConfigurationEnactment[],
  nodes: IoK8sApiCoreV1Node[],
): NNCPToNodeEnactmentStateMap =>
  nnces?.reduce((acc, nnce) => {
    const nncp = getEnactmentStateNNCP(nnce);
    const nodeName = getEnactmentStateNode(nnce);
    const status = getEnactmentStatus(nnce);

    if (!nncp || !nodeName) return acc;

    acc[nncp] = {
      ...acc[nncp],
      [nodeName]: { node: getNodeByName(nodeName, nodes), status },
    };

    return acc;
  }, {} as NNCPToNodeEnactmentStateMap) ?? {};

// Only enactments for the nodes the policy selects describe this configuration: an enactment for a
// node outside the selector must not change the state shown for the policy.
const getSelectedEnactmentStates = (
  nodeToEnactmentStateMap: NodeToEnactmentStateMap,
  nncpNodes: IoK8sApiCoreV1Node[],
): NodeToEnactmentStateMap => {
  if (!nodeToEnactmentStateMap) return undefined;

  const selectedNodeNames = new Set(nncpNodes.map((node) => getName(node)));
  const selectedStates = Object.entries(nodeToEnactmentStateMap).filter(([nodeName]) =>
    selectedNodeNames.has(nodeName),
  );

  return selectedStates.length > 0 ? Object.fromEntries(selectedStates) : undefined;
};

const getConfigurationDetails = (
  nncp: V1NodeNetworkConfigurationPolicy,
  nodes: IoK8sApiCoreV1Node[],
  nodeToEnactmentStateMap: NodeToEnactmentStateMap,
  t: TFunction,
): ConfigurationDetails => {
  const nncpNodes = filterNodes(nodes, nncp?.spec?.nodeSelector);
  const selectedEnactmentStates = getSelectedEnactmentStates(nodeToEnactmentStateMap, nncpNodes);

  return {
    aggregationMode: getAggregationMode(nncp),
    configurationName: getName(nncp),
    description: getAnnotations(nncp)?.description,
    enactmentState: getConfigurationEnactmentState(selectedEnactmentStates),
    mtu: getMTU(nncp),
    nncp,
    nodes: nncpNodes,
    nodeToEnactmentStateMap: selectedEnactmentStates,
    numNodes: nncpNodes?.length || 0,
    physicalNetworkName: '',
    uplink: getUplinkDisplayText(nncp, t),
  };
};

const getConfigurationDetailsMap = (
  nncps: V1NodeNetworkConfigurationPolicy[],
  nodes: IoK8sApiCoreV1Node[],
  nnces: V1beta1NodeNetworkConfigurationEnactment[],
  t: TFunction,
): ConfigurationDetailsMap => {
  const nnceStateMap = getEnactmentStateMap(nnces, nodes);

  return (nncps || []).reduce((acc, nncp) => {
    acc[getName(nncp)] = getConfigurationDetails(nncp, nodes, nnceStateMap?.[getName(nncp)], t);
    return acc;
  }, {} as ConfigurationDetailsMap);
};

const getEmptyNetwork = (name: string): PhysicalNetwork => ({
  consumersByNAD: {},
  nads: [],
  name,
  nncpDetails: [],
  observedMappings: [],
  selectedNodes: [],
});

export const getNADPhysicalNetworks = (nads: LocalnetNAD[]): PhysicalNetwork[] => {
  const networks: PhysicalNetwork[] = [];

  nads.forEach((nad) => {
    const network = networks.find(({ name }) => name === nad.physicalNetworkName);

    if (network) {
      network.nads.push(nad);
    } else {
      networks.push({ ...getEmptyNetwork(nad.physicalNetworkName), nads: [nad] });
    }
  });

  return networks;
};

export const getConsumersByNAD = (
  pods: IoK8sApiCoreV1Pod[],
  virtualMachines: V1VirtualMachine[],
): Record<string, PhysicalNetworkConsumer[]> => {
  const consumersByNAD: Record<string, PhysicalNetworkConsumer[]> = {};

  const add = (references: string[], consumer: PhysicalNetworkConsumer) => {
    references.forEach((reference) => {
      const existing = consumersByNAD[reference] || [];
      const isDuplicate = existing.some(
        ({ kind, name, namespace }) =>
          kind === consumer.kind && name === consumer.name && namespace === consumer.namespace,
      );
      if (isDuplicate) return;

      consumersByNAD[reference] = [...existing, consumer];
    });
  };

  // virt-launcher Pods only mirror their VM; the VM itself is the consumer.
  (pods || [])
    .filter((pod) => !isVirtLauncherPod(pod))
    .forEach((pod) =>
      add(getPodNADReferences(pod), {
        groupVersionKind: modelToGroupVersionKind(PodModel),
        kind: 'Pod',
        name: getName(pod),
        namespace: getNamespace(pod),
        url: getResourceURL({ model: PodModel, resource: pod }),
      }),
    );

  (virtualMachines || []).forEach((vm) =>
    add(getVMNADReferences(vm), {
      groupVersionKind: modelToGroupVersionKind(VirtualMachineModel),
      kind: 'VirtualMachine',
      name: getName(vm),
      namespace: getNamespace(vm),
      url: getResourceURL({ model: VirtualMachineModel, resource: vm }),
    }),
  );

  return consumersByNAD;
};

export const attachConsumers = (
  networks: PhysicalNetwork[],
  consumersByNAD: Record<string, PhysicalNetworkConsumer[]>,
): PhysicalNetwork[] =>
  networks.map((network) => ({
    ...network,
    consumersByNAD: network.nads.reduce(
      (acc, { name, namespace }) => {
        const key = `${namespace}/${name}`;
        return consumersByNAD[key] ? { ...acc, [key]: consumersByNAD[key] } : acc;
      },
      {} as Record<string, PhysicalNetworkConsumer[]>,
    ),
  }));

export const getPolicyPhysicalNetworks = (
  nncps: V1NodeNetworkConfigurationPolicy[],
  workerNodes: IoK8sApiCoreV1Node[],
  nnces: V1beta1NodeNetworkConfigurationEnactment[],
  t: TFunction,
): PhysicalNetwork[] => {
  const networks: PhysicalNetwork[] = [];

  (nncps || []).forEach((nncp) => {
    getPolicyLocalnetNames(nncp).forEach((name) => {
      const network = networks.find((candidate) => candidate.name === name);
      if (!network) networks.push(getEmptyNetwork(name));
    });
  });

  const nncpDetailsMap = getConfigurationDetailsMap(nncps, workerNodes, nnces, t);

  (nncps || []).forEach((nncp) => {
    const details = nncpDetailsMap[getName(nncp)];

    getPolicyLocalnetNames(nncp).forEach((name) => {
      const network = networks.find((candidate) => candidate.name === name);
      if (!network || !details) return;

      network.nncpDetails.push({ ...details, physicalNetworkName: name });
      details.nodes?.forEach((node) => {
        if (!network.selectedNodes.some(({ metadata }) => metadata?.name === getName(node))) {
          network.selectedNodes.push(node);
        }
      });
    });
  });

  return networks;
};

export const getObservedMappings = (
  nodeNetworkStates: NodeNetworkStateKind[],
  nodes: IoK8sApiCoreV1Node[],
): Record<string, ObservedMapping[]> =>
  getObservedBridgeMappings(nodeNetworkStates).reduce(
    (acc, { bridge, localnet, nodeName }) => {
      const mapping: ObservedMapping = {
        bridge,
        node: nodes?.find((node) => getName(node) === nodeName),
        nodeName,
      };

      return { ...acc, [localnet]: [...(acc[localnet] || []), mapping] };
    },
    {} as Record<string, ObservedMapping[]>,
  );

export const mergePhysicalNetworks = (...parts: PhysicalNetwork[][]): PhysicalNetwork[] => {
  const merged = new Map<string, PhysicalNetwork>();

  parts.flat().forEach((part) => {
    const existing = merged.get(part.name);

    if (!existing) {
      merged.set(part.name, {
        ...getEmptyNetwork(part.name),
        consumersByNAD: { ...part.consumersByNAD },
        nads: [...part.nads],
        nncpDetails: [...part.nncpDetails],
        observedMappings: [...part.observedMappings],
        selectedNodes: [...part.selectedNodes],
      });
      return;
    }

    const observedMappings = [...existing.observedMappings];
    part.observedMappings.forEach((mapping) => {
      const key = `${mapping.nodeName}/${mapping.bridge}`;
      const isDuplicate = observedMappings.some(
        (candidate) => `${candidate.nodeName}/${candidate.bridge}` === key,
      );
      if (!isDuplicate) observedMappings.push(mapping);
    });

    part.selectedNodes.forEach((node) => {
      if (!existing.selectedNodes.some(({ metadata }) => metadata?.name === getName(node))) {
        existing.selectedNodes.push(node);
      }
    });

    existing.nads.push(...part.nads);
    existing.nncpDetails.push(...part.nncpDetails);
    existing.observedMappings = observedMappings;
    existing.consumersByNAD = { ...existing.consumersByNAD, ...part.consumersByNAD };
  });

  return [...merged.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
  );
};
