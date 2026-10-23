import { ComponentType } from 'react';

import { IoK8sApiCoreV1Pod } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { CubeIcon, NetworkIcon, ServerIcon } from '@patternfly/react-icons';
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
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';
import {
  addClusterUserDefinedNetworkNodesAndEdges,
  addNetworkAttachmentDefinitionNodes,
  addPodNodesAndEdges,
  addUserDefinedNetworkNodesAndEdges,
  addVirtualMachineNodesAndEdges,
  getResourceID,
} from '@views/topology/utils/dataTransformation/resourceUtils';

import { NODE_DIAMETER, RelationshipType, ResourceType } from '../constants';

const getIconForResourceType = (resourceType: ResourceType): ComponentType => {
  switch (resourceType) {
    case ResourceType.NetworkAttachmentDefinition:
    case ResourceType.UserDefinedNetwork:
    case ResourceType.ClusterUserDefinedNetwork:
      return NetworkIcon;
    case ResourceType.Pod:
      return CubeIcon;
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
  options?: { badge?: string; isDerivedFromPolicy?: boolean },
): NodeModel => {
  const id = getResourceID(resource);
  const status = getResourceStatus(resource, resourceType);

  return {
    data: {
      badge: options?.badge,
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

export const generateDataModel = (resources: NetworkTopologyResources): Model => {
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

  return {
    edges,
    graph: {
      id: 'networking-configuration-topology',
      layout: 'Levels',
      type: ModelKind.graph,
    },
    nodes: nodes.filter((n) => n.type !== 'group' || (n.children && n.children.length)),
  };
};
