import { ComponentType } from 'react';

import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import { K8sModel, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { NetworkIcon, ServerIcon } from '@patternfly/react-icons';
import {
  EdgeModel,
  EdgeStyle,
  EdgeTerminalType,
  Model,
  ModelKind,
  NodeModel,
  NodeShape,
  NodeStatus,
} from '@patternfly/react-topology';
import { getName, getNamespace } from '@utils/resources/shared';
import { udnIsReady } from '@utils/resources/udns/helper';
import { PrintableVMErrorStatus, PrintableVMStatus } from '@utils/resources/vm/constants';
import { getVMStatus } from '@utils/resources/vm/selectors';
import { PodPhase } from '@views/services/details/tabs/pods/constants';
import { getPodPhase } from '@views/services/details/tabs/pods/utils';
import { createScopeIcon, TopologyPodIcon } from '@views/topology/components/TopologyIcons';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';
import { TopologyGroupType } from '@views/topology/types';
import {
  addClusterUserDefinedNetworkNodesAndEdges,
  addNetworkAttachmentDefinitionNodes,
  addPodNodesAndEdges,
  addUserDefinedNetworkNodesAndEdges,
  addVirtualMachineNodesAndEdges,
  getResourceID,
} from '@views/topology/utils/dataTransformation/resourceUtils';

import { NODE_DIAMETER, RelationshipType, ResourceType, TopologyViewTypes } from '../constants';

const getIconForResourceType = (resourceType: ResourceType): ComponentType => {
  switch (resourceType) {
    case ResourceType.NetworkAttachmentDefinition:
    case ResourceType.UserDefinedNetwork:
    case ResourceType.ClusterUserDefinedNetwork:
      return NetworkIcon;
    case ResourceType.Pod:
      return TopologyPodIcon;
    case ResourceType.VirtualMachine:
      return ServerIcon;
    default:
      return NetworkIcon;
  }
};

const getShapeForResourceType = (resourceType: ResourceType): NodeShape => {
  switch (resourceType) {
    case ResourceType.NetworkAttachmentDefinition:
      return NodeShape.octagon;
    case ResourceType.UserDefinedNetwork:
    case ResourceType.ClusterUserDefinedNetwork:
      return NodeShape.hexagon;
    case ResourceType.Pod:
    case ResourceType.VirtualMachine:
      return NodeShape.ellipse;
    default:
      return NodeShape.ellipse;
  }
};

const getResourceStatus = (resource: K8sResourceCommon, resourceType: ResourceType): NodeStatus => {
  switch (resourceType) {
    case ResourceType.Pod: {
      const podPhase = getPodPhase(resource as IoK8sApiCoreV1Pod);
      if (podPhase === PodPhase.Succeeded || podPhase === PodPhase.Running)
        return NodeStatus.success;
      if (podPhase === PodPhase.Failed) return NodeStatus.danger;
      return NodeStatus.default;
    }
    case ResourceType.VirtualMachine: {
      const vmStatus = getVMStatus(resource as V1VirtualMachine) as
        PrintableVMErrorStatus | PrintableVMStatus;

      if (Object.keys(PrintableVMErrorStatus).includes(vmStatus)) return NodeStatus.danger;
      if (vmStatus === PrintableVMStatus.Unknown) return NodeStatus.warning;
      if (Object.keys(PrintableVMStatus).includes(vmStatus)) return NodeStatus.success;
      return NodeStatus.default;
    }
    case ResourceType.UserDefinedNetwork:
    case ResourceType.ClusterUserDefinedNetwork:
      return udnIsReady(resource) ? NodeStatus.success : NodeStatus.danger;
    case ResourceType.NetworkAttachmentDefinition:
    default:
      return NodeStatus.default;
  }
};

export const createNode = (
  resource: K8sResourceCommon,
  resourceType: ResourceType,
  level: number,
  options?: {
    badge?: string;
    badgeBorderColor?: string;
    badgeColor?: string;
    badgeTextColor?: string;
    isDerivedFromPolicy?: boolean;
  },
): NodeModel => {
  const id = getResourceID(resource);
  const status = getResourceStatus(resource, resourceType);

  return {
    data: {
      badge: options?.badge,
      badgeBorderColor: options?.badgeBorderColor,
      badgeColor: options?.badgeColor,
      badgeTextColor: options?.badgeTextColor,
      icon: getIconForResourceType(resourceType),
      isDerivedFromPolicy: options?.isDerivedFromPolicy,
      level,
      namespace: getNamespace(resource),
      resource,
      resourceType,
      status,
    },
    height: NODE_DIAMETER,
    id,
    label: getName(resource) || 'Unknown',
    shape: getShapeForResourceType(resourceType),
    status,
    type: 'node',
    width: NODE_DIAMETER,
  };
};

const getNodeKind = (node: NodeModel): string | undefined => {
  if (node.data?.scope === TopologyViewTypes.namespace) return 'Namespace';
  if (node.data?.scope === TopologyViewTypes.owner) {
    return node.data.scopeKey?.split('/')[0];
  }

  const resource = node.data?.resource as K8sResourceCommon | undefined;
  return resource?.kind ?? node.data?.resourceType;
};

const applyK8sModelBadges = (
  nodes: NodeModel[],
  k8sModels: Record<string, K8sModel>,
): NodeModel[] => {
  const modelsByKind = new Map(Object.values(k8sModels).map((model) => [model.kind, model]));

  return nodes.map((node) => {
    const model = modelsByKind.get(getNodeKind(node));
    if (!model) return node;

    return {
      ...node,
      data: {
        ...node.data,
        badge: model.abbr,
        badgeClassName: 'topology-icon',
        badgeColor: model.color ?? '#2B9AF3',
        badgeKind: model.kind,
      },
    };
  });
};

export const createEdge = (
  sourceId: string,
  targetId: string,
  relationshipType: RelationshipType,
): EdgeModel => {
  return {
    data: {
      endTerminalType: EdgeTerminalType.directional,
      relationshipType,
      sourceId,
      targetId,
    },
    edgeStyle: EdgeStyle.solid,
    id: `${sourceId}-to-${targetId}`,
    source: sourceId,
    target: targetId,
    type: 'edge',
  };
};

export const findExistingEdge = (
  edges: EdgeModel[],
  sourceId: string,
  targetId: string,
): EdgeModel | undefined => {
  return edges.find(
    (e) =>
      (e.data.sourceId === sourceId && e.data.targetId === targetId) ||
      (e.data.sourceId === targetId && e.data.targetId === sourceId),
  );
};

const isNetworkNode = (node: NodeModel): boolean =>
  [
    ResourceType.ClusterUserDefinedNetwork,
    ResourceType.NetworkAttachmentDefinition,
    ResourceType.UserDefinedNetwork,
  ].includes(node.data?.resourceType);

const getNetworkGroup = (node: NodeModel): string => {
  if (node.data?.scope === TopologyViewTypes.network && node.data?.scopeKey) {
    return node.data.scopeKey;
  }
  const resource = node.data?.resource as K8sResourceCommon | undefined;
  const annotations = resource?.metadata?.annotations as Record<string, string> | undefined;
  const networks = annotations?.['k8s.v1.cni.cncf.io/networks'];
  if (networks) {
    let firstNetwork: string | undefined;
    try {
      const parsed = JSON.parse(networks) as unknown;
      if (typeof parsed === 'string') {
        firstNetwork = parsed;
      } else if (Array.isArray(parsed)) {
        const first = parsed[0];
        firstNetwork = typeof first === 'string' ? first : (first as { name?: string })?.name;
      } else if (typeof parsed === 'object' && parsed !== null) {
        firstNetwork = (parsed as { name?: string }).name;
      }
    } catch {
      firstNetwork = networks.split(',')[0]?.trim();
    }
    if (firstNetwork) {
      const parts = firstNetwork.split('/').filter(Boolean);
      if (parts.length > 1) return parts.join('/');
      return node.data?.namespace ? `${node.data.namespace}/${parts[0]}` : parts[0];
    }
  }
  if (
    node.data?.resourceType === ResourceType.NetworkAttachmentDefinition ||
    node.data?.resourceType === ResourceType.UserDefinedNetwork ||
    node.data?.resourceType === ResourceType.ClusterUserDefinedNetwork
  ) {
    const networkName = node.label ?? 'Default network';
    return node.data?.namespace ? `${node.data.namespace}/${networkName}` : networkName;
  }
  return 'Default network';
};

const getScopeKey = (node: NodeModel, scope: TopologyViewTypes): string | undefined => {
  switch (scope) {
    case TopologyViewTypes.owner:
      return getOwnerGroup(node);
    case TopologyViewTypes.namespace:
      return node.data?.namespace || 'Cluster-scoped';
    case TopologyViewTypes.network:
      return getNetworkGroup(node);
    default:
      return node.id;
  }
};

const getIconForScope = (scope: TopologyViewTypes, scopeKey: string): ComponentType =>
  createScopeIcon(scope, scope === TopologyViewTypes.owner ? scopeKey.split('/')[0] : undefined);

const createScopeNode = (
  sourceNode: NodeModel,
  scope: TopologyViewTypes,
  key: string,
): NodeModel => ({
  data: {
    icon: getIconForScope(scope, key),
    namespace: sourceNode.data?.namespace,
    resourceType: sourceNode.data?.resourceType,
    scope,
    scopeKey: key,
  },
  height: NODE_DIAMETER,
  id: `topology-scope-${scope}-${key}`,
  label: scope === TopologyViewTypes.network ? key.split('/').pop() || key : key,
  shape: sourceNode.shape,
  status: sourceNode.status,
  type: 'node',
  width: NODE_DIAMETER,
});

const getResourceOwnerKey = (node: NodeModel): string | undefined => {
  const resource = node.data?.resource as K8sResourceCommon | undefined;
  const kind = resource?.kind ?? node.data?.resourceType;
  const name = resource?.metadata?.name;
  return kind && name ? `${kind}/${name}` : undefined;
};

const createScopedModel = (
  nodes: NodeModel[],
  edges: EdgeModel[],
  scope: TopologyViewTypes,
): { edges: EdgeModel[]; nodes: NodeModel[] } => {
  if (scope === TopologyViewTypes.resource) {
    return { edges, nodes };
  }

  const scopedNodes = new Map<string, NodeModel>();
  const nodeToScopedNode = new Map<string, string>();
  const resourceNodesByOwnerKey = new Map<string, NodeModel>();
  nodes.forEach((node) => {
    const ownerKey = getResourceOwnerKey(node);
    if (ownerKey) resourceNodesByOwnerKey.set(ownerKey, node);
  });

  nodes.forEach((node) => {
    if (scope === TopologyViewTypes.network && !isNetworkNode(node)) {
      return;
    }
    if (scope === TopologyViewTypes.namespace && !node.data?.namespace) {
      scopedNodes.set(node.id, node);
      nodeToScopedNode.set(node.id, node.id);
      return;
    }
    const key = getScopeKey(node, scope);
    if (!key) {
      if (scope === TopologyViewTypes.owner) {
        scopedNodes.set(node.id, {
          ...node,
          data: {
            ...node.data,
            icon: getIconForResourceType(node.data?.resourceType),
          },
        });
        nodeToScopedNode.set(node.id, node.id);
      }
      return;
    }
    const existingOwnerNode =
      scope === TopologyViewTypes.owner ? resourceNodesByOwnerKey.get(key) : undefined;
    if (existingOwnerNode) {
      nodeToScopedNode.set(node.id, existingOwnerNode.id);
      if (!scopedNodes.has(existingOwnerNode.id)) {
        scopedNodes.set(existingOwnerNode.id, existingOwnerNode);
      }
      return;
    }
    const scopedId = `topology-scope-${scope}-${key}`;
    nodeToScopedNode.set(node.id, scopedId);
    if (!scopedNodes.has(scopedId)) {
      scopedNodes.set(scopedId, createScopeNode(node, scope, key));
    }
  });

  const scopedEdges = new Map<string, EdgeModel>();
  edges.forEach((edge) => {
    const source = nodeToScopedNode.get(edge.source ?? '');
    const target = nodeToScopedNode.get(edge.target ?? '');
    if (!source || !target || source === target) return;
    const id = `${source}-to-${target}`;
    if (!scopedEdges.has(id)) {
      scopedEdges.set(id, createEdge(source, target, RelationshipType.Scope));
    }
  });

  return { edges: [...scopedEdges.values()], nodes: [...scopedNodes.values()] };
};

const getOwnerGroup = (node: NodeModel): string => {
  if (node.data?.scope === TopologyViewTypes.owner && node.data?.scopeKey) {
    return node.data.scopeKey;
  }
  const resource = node.data?.resource as K8sResourceCommon | undefined;
  const owner = resource?.metadata?.ownerReferences?.find((reference) => reference.controller);
  if (owner) return `${owner.kind}/${owner.name}`;
  return undefined;
};

const groupLabel = (node: NodeModel, groupType: TopologyGroupType): string | undefined => {
  switch (groupType) {
    case TopologyGroupType.namespace:
      return node.data?.namespace;
    case TopologyGroupType.owner:
      return getOwnerGroup(node);
    default:
      return '';
  }
};

const groupIcon = (groupType: TopologyGroupType, label: string): ComponentType =>
  createScopeIcon(
    groupType === TopologyGroupType.owner ? TopologyViewTypes.owner : TopologyViewTypes.namespace,
    groupType === TopologyGroupType.owner ? label.split('/')[0] : undefined,
  );

const addGroups = (nodes: NodeModel[], groupType: TopologyGroupType): NodeModel[] => {
  if (groupType === TopologyGroupType.none) return nodes;

  if (groupType === TopologyGroupType.namespaceOwner) {
    const namespaceGroups = new Map<string, NodeModel>();
    const ownerGroups = new Map<string, NodeModel>();

    nodes.forEach((node) => {
      const namespace = node.data?.namespace;
      if (!namespace) return;
      const namespaceId = `topology-group-${groupType}-namespace-${namespace}`;
      const namespaceGroup = namespaceGroups.get(namespaceId);
      const owner = getOwnerGroup(node);

      if (owner) {
        const ownerId = `topology-group-${groupType}-owner-${namespace}-${owner}`;
        const ownerGroup = ownerGroups.get(ownerId);
        if (ownerGroup) {
          ownerGroup.children?.push(node.id);
        } else {
          ownerGroups.set(ownerId, {
            children: [node.id],
            data: {
              groupType: TopologyGroupType.owner,
              icon: groupIcon(TopologyGroupType.owner, owner),
            },
            group: true,
            id: ownerId,
            label: owner,
            style: { padding: 40 },
            type: 'group',
          });
        }
        if (namespaceGroup) {
          namespaceGroup.children?.push(ownerId);
        } else {
          namespaceGroups.set(namespaceId, {
            children: [ownerId],
            data: {
              groupType: TopologyGroupType.namespace,
              icon: groupIcon(TopologyGroupType.namespace, namespace),
            },
            group: true,
            id: namespaceId,
            label: namespace,
            style: { padding: 40 },
            type: 'group',
          });
        }
        return;
      }

      if (namespaceGroup) {
        namespaceGroup.children?.push(node.id);
      } else {
        namespaceGroups.set(namespaceId, {
          children: [node.id],
          data: {
            groupType: TopologyGroupType.namespace,
            icon: groupIcon(TopologyGroupType.namespace, namespace),
          },
          group: true,
          id: namespaceId,
          label: namespace,
          style: { padding: 40 },
          type: 'group',
        });
      }
    });

    return [...nodes, ...ownerGroups.values(), ...namespaceGroups.values()];
  }

  const groups = new Map<string, NodeModel>();
  nodes.forEach((node) => {
    const label = groupLabel(node, groupType);
    if (!label) return;
    const id = `topology-group-${groupType}-${label}`;
    const group = groups.get(id);
    if (group) {
      group.children?.push(node.id);
      return;
    }
    groups.set(id, {
      children: [node.id],
      data: { groupType, icon: groupIcon(groupType, label) },
      group: true,
      id,
      label,
      style: { padding: 40 },
      type: 'group',
    });
  });
  return [...nodes, ...groups.values()];
};

export const generateDataModel = (
  resources: NetworkTopologyResources,
  scope: TopologyViewTypes = TopologyViewTypes.resource,
  groupType: TopologyGroupType = TopologyGroupType.none,
  resourceTypes: ResourceType[] = [],
  k8sModels: Record<string, K8sModel> = {},
): Model => {
  const nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];
  const nodeMap = new Map<string, NodeModel>();

  addNetworkAttachmentDefinitionNodes(resources.networkAttachmentDefinitions, nodes, nodeMap);
  addPodNodesAndEdges(resources.pods, nodes, edges, nodeMap);
  addVirtualMachineNodesAndEdges(resources.virtualMachines, nodes, edges, nodeMap);
  addUserDefinedNetworkNodesAndEdges(
    resources.userDefinedNetworks,
    nodes,
    edges,
    nodeMap,
    resources.pods,
    resources.virtualMachines,
    resources.networkAttachmentDefinitions,
  );
  addClusterUserDefinedNetworkNodesAndEdges(
    resources.clusterUserDefinedNetworks,
    nodes,
    edges,
    nodeMap,
    resources.pods,
    resources.virtualMachines,
    resources.networkAttachmentDefinitions,
    resources.projects,
  );

  const selectedTypes = new Set(resourceTypes);
  const filteredNodes =
    selectedTypes.size === 0
      ? nodes
      : nodes.filter((node) => selectedTypes.has(node.data?.resourceType));
  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));
  const filteredEdges =
    selectedTypes.size === 0
      ? edges
      : edges.filter(
          (edge) =>
            filteredNodeIds.has(edge.source ?? '') && filteredNodeIds.has(edge.target ?? ''),
        );
  const scopedModel = createScopedModel(filteredNodes, filteredEdges, scope);
  const scopedNodes = applyK8sModelBadges(scopedModel.nodes, k8sModels ?? {});

  return {
    edges: scopedModel.edges,
    graph: {
      id: 'networking-configuration-topology',
      layout: 'Levels',
      type: ModelKind.graph,
    },
    nodes: addGroups(scopedNodes, groupType),
  };
};
