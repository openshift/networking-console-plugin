import { ComponentType } from 'react';

import {
  IoK8sApiCoreV1Service,
  IoK8sApiNetworkingV1Ingress,
  IoK8sApiNetworkingV1NetworkPolicy,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { CubeIcon, GlobeRouteIcon, LockIcon, NetworkIcon } from '@patternfly/react-icons';
import {
  EdgeModel,
  EdgeStyle,
  EdgeTerminalType,
  Model,
  ModelKind,
  NodeModel,
  NodeShape,
} from '@patternfly/react-topology';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getAnnotations, getName, getNamespace } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { RouteKind } from '@utils/types';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';

import {
  MULTI_NETWORK_POLICY_NADS_ANNOTATION_KEY,
  NODE_DIAMETER,
  RelationshipType,
  ResourceType,
} from './constants';

const getResourceID = (resource: K8sResourceCommon): string => {
  const namespace = getNamespace(resource) || 'cluster';
  const name = getName(resource) || 'unknown';
  const kind = resource.kind || 'unknown';
  return `${kind}-${namespace}-${name}`;
};

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
    default:
      return NetworkIcon;
  }
};

const createNode = (
  resource: K8sResourceCommon,
  resourceType: ResourceType,
  level: number,
  options?: { badge?: string; isDerivedFromPolicy?: boolean },
): NodeModel => {
  const id = getResourceID(resource);
  return {
    data: {
      badge: options?.badge,
      icon: getIconForResourceType(resourceType),
      isDerivedFromPolicy: options?.isDerivedFromPolicy,
      level,
      namespace: getNamespace(resource),
      resource,
      resourceType,
    },
    height: NODE_DIAMETER,
    id,
    label: getName(resource) || 'Unknown',
    shape: NodeShape.ellipse,
    type: 'node',
    width: NODE_DIAMETER,
  };
};

const createEdge = (
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

const findExistingEdge = (
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

const extractIngressBackends = (ingress: IoK8sApiNetworkingV1Ingress): string[] => {
  const backends = new Set<string>();

  ingress.spec?.rules?.forEach((rule) => {
    rule.http?.paths?.forEach((path) => {
      if (path.backend?.service?.name) {
        backends.add(path.backend.service.name);
      }
    });
  });

  if (ingress.spec?.defaultBackend?.service?.name) {
    backends.add(ingress.spec.defaultBackend.service.name);
  }

  return Array.from(backends);
};

const extractRouteBackends = (route: RouteKind): string[] => {
  const backends = new Set<string>();

  if (route.spec?.to?.name) {
    backends.add(route.spec.to.name);
  }

  route.spec?.alternateBackends?.forEach((backend) => {
    if (backend.name) {
      backends.add(backend.name);
    }
  });

  return Array.from(backends);
};

const extractMultiNetworkPolicyNADs = (policy: IoK8sApiNetworkingV1NetworkPolicy): string[] => {
  const annotation = getAnnotations(policy)?.[MULTI_NETWORK_POLICY_NADS_ANNOTATION_KEY];
  if (!annotation) return [];

  return annotation
    .split(',')
    .map((nad) => nad.trim())
    .filter(Boolean);
};

export const generateDataModel = (resources: NetworkTopologyResources): Model => {
  const nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];
  const nodeMap = new Map<string, NodeModel>();

  resources.services?.forEach((service: IoK8sApiCoreV1Service) => {
    const id = getResourceID(service);
    const node = createNode(service, ResourceType.Service, 1, { badge: 'SVC' });
    nodes.push(node);
    nodeMap.set(id, node);
  });

  resources.ingresses?.forEach((ingress: IoK8sApiNetworkingV1Ingress) => {
    const id = getResourceID(ingress);
    const node = createNode(ingress, ResourceType.Ingress, 0, { badge: 'ING' });
    nodes.push(node);
    nodeMap.set(id, node);

    const backends = extractIngressBackends(ingress);
    backends.forEach((serviceName) => {
      const serviceId = `Service-${getNamespace(ingress)}-${serviceName}`;
      const serviceNode = nodeMap.get(serviceId);
      if (serviceNode && id !== serviceId) {
        const existingEdge = findExistingEdge(edges, id, serviceId);
        if (!existingEdge) {
          edges.push(createEdge(id, serviceId, RelationshipType.IngressToService));
        }
      }
    });
  });

  resources.routes?.forEach((route: RouteKind) => {
    const id = getResourceID(route);
    const node = createNode(route, ResourceType.Route, 0, { badge: 'RT' });
    nodes.push(node);
    nodeMap.set(id, node);

    const backends = extractRouteBackends(route);
    backends.forEach((serviceName) => {
      const serviceId = `Service-${getNamespace(route)}-${serviceName}`;
      const serviceNode = nodeMap.get(serviceId);
      if (serviceNode && id !== serviceId) {
        const existingEdge = findExistingEdge(edges, id, serviceId);
        if (!existingEdge) {
          edges.push(createEdge(id, serviceId, RelationshipType.RouteToService));
        }
      }
    });
  });

  resources.networkAttachmentDefinitions?.forEach((nad: NetworkAttachmentDefinitionKind) => {
    const id = getResourceID(nad);
    const node = createNode(nad, ResourceType.NetworkAttachmentDefinition, 2, {
      badge: 'NAD',
    });
    nodes.push(node);
    nodeMap.set(id, node);
  });

  resources.multiNetworkPolicies?.forEach((policy: IoK8sApiNetworkingV1NetworkPolicy) => {
    const id = getResourceID(policy);
    const node = createNode(policy, ResourceType.MultiNetworkPolicy, 4, {
      badge: 'MNP',
      isDerivedFromPolicy: true,
    });
    nodes.push(node);
    nodeMap.set(id, node);

    const nads = extractMultiNetworkPolicyNADs(policy);
    nads.forEach((nadName) => {
      const nadID = `NetworkAttachmentDefinition-${getNamespace(policy)}-${nadName}`;
      const nadNode = nodeMap.get(nadID);
      if (nadNode && id !== nadID) {
        const existingEdge = findExistingEdge(edges, id, nadID);
        if (!existingEdge) {
          edges.push(createEdge(id, nadID, RelationshipType.MultiNetworkPolicyToNAD));
        }
      }
    });
  });

  resources.networkPolicies?.forEach((policy: IoK8sApiNetworkingV1NetworkPolicy) => {
    const id = getResourceID(policy);
    const node = createNode(policy, ResourceType.NetworkPolicy, 4, {
      badge: 'NP',
      isDerivedFromPolicy: true,
    });
    nodes.push(node);
    nodeMap.set(id, node);
  });

  resources.userDefinedNetworks?.forEach((udn: UserDefinedNetworkKind) => {
    const id = getResourceID(udn);
    const node = createNode(udn, ResourceType.UserDefinedNetwork, 3, { badge: 'UDN' });
    nodes.push(node);
    nodeMap.set(id, node);
  });

  resources.clusterUserDefinedNetworks?.forEach((cudn: ClusterUserDefinedNetworkKind) => {
    const id = getResourceID(cudn);
    const node = createNode(cudn, ResourceType.ClusterUserDefinedNetwork, 3, {
      badge: 'CUDN',
    });
    nodes.push(node);
    nodeMap.set(id, node);
  });

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
