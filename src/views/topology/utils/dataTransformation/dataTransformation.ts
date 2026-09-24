import { ComponentType } from 'react';

import {
  IoK8sApiCoreV1Pod,
  IoK8sApiCoreV1Service,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import {
  CubeIcon,
  GlobeRouteIcon,
  LockIcon,
  NetworkIcon,
  ServerIcon,
} from '@patternfly/react-icons';
import {
  EdgeModel,
  EdgeStyle,
  EdgeTerminalType,
  Model,
  ModelKind,
  NodeModel,
  NodeShape,
} from '@patternfly/react-topology';
import { getName, getNamespace } from '@utils/resources/shared';
import { getVMStatus } from '@utils/resources/vm/selectors';
import { RouteKind } from '@utils/types';
import { routeStatus } from '@views/routes/list/utils/utils';
import { podPhase } from '@views/services/details/tabs/pods/utils';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';
import {
  addClusterUserDefinedNetworkNodesAndEdges,
  addIngressNodesAndEdges,
  addMultiNetworkPolicyNodesAndEdges,
  addNetworkAttachmentDefinitionNodes,
  addNetworkPolicyNodes,
  addPodNodesAndEdges,
  addRouteNodesAndEdges,
  addServiceNodes,
  addUserDefinedNetworkNodesAndEdges,
  addVirtualMachineNodesAndEdges,
  getResourceID,
} from '@views/topology/utils/dataTransformation/resourceUtils';

import { NODE_DIAMETER, RelationshipType, ResourceType } from '../constants';

const getIconForResourceType = (resourceType: ResourceType): ComponentType => {
  switch (resourceType) {
    case ResourceType.Service:
      return CubeIcon;
    case ResourceType.Ingress:
    case ResourceType.Route:
      return GlobeRouteIcon;
    case ResourceType.NetworkPolicy:
    case ResourceType.MultiNetworkPolicy:
      return LockIcon;
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
    case ResourceType.Service:
      return NodeShape.ellipse;
    case ResourceType.Ingress:
    case ResourceType.Route:
      return NodeShape.rect;
    case ResourceType.NetworkPolicy:
    case ResourceType.MultiNetworkPolicy:
      return NodeShape.circle;
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

const getResourceStatus = (
  resource: K8sResourceCommon,
  resourceType: ResourceType,
): string | undefined => {
  switch (resourceType) {
    case ResourceType.Pod:
      return podPhase(resource as IoK8sApiCoreV1Pod);

    case ResourceType.VirtualMachine:
      return getVMStatus(resource as V1VirtualMachine);

    case ResourceType.Route:
      return routeStatus(resource as RouteKind);

    case ResourceType.Service:
      return (resource as IoK8sApiCoreV1Service)?.spec?.type;

    case ResourceType.Ingress:
    case ResourceType.NetworkPolicy:
    case ResourceType.MultiNetworkPolicy:
    case ResourceType.NetworkAttachmentDefinition:
    case ResourceType.UserDefinedNetwork:
    case ResourceType.ClusterUserDefinedNetwork:
    default:
      return undefined;
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

  addServiceNodes(resources.services, nodes, nodeMap);
  addIngressNodesAndEdges(resources.ingresses, nodes, edges, nodeMap);
  addRouteNodesAndEdges(resources.routes, nodes, edges, nodeMap);
  addNetworkAttachmentDefinitionNodes(resources.networkAttachmentDefinitions, nodes, nodeMap);
  addNetworkPolicyNodes(resources.networkPolicies, nodes, nodeMap);
  addMultiNetworkPolicyNodesAndEdges(resources.multiNetworkPolicies, nodes, edges, nodeMap);
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
  );
  addPodNodesAndEdges(resources.pods, nodes, edges, nodeMap);
  addVirtualMachineNodesAndEdges(resources.virtualMachines, nodes, edges, nodeMap);

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
