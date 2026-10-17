import {
  IoK8sApiCoreV1Pod,
  IoK8sApiCoreV1Service,
  IoK8sApiNetworkingV1Ingress,
  IoK8sApiNetworkingV1NetworkPolicy,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { EdgeModel, NodeModel } from '@patternfly/react-topology';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getAnnotations, getName, getNamespace } from '@utils/resources/shared';
import { CLUSTER_UDN_NAD_NAME_PREFIX } from '@utils/resources/udns/constants';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { RouteKind } from '@utils/types';
import {
  MULTI_NETWORK_POLICY_NADS_ANNOTATION_KEY,
  RelationshipType,
  ResourceType,
} from '@views/topology/utils/constants';
import {
  createEdge,
  createNode,
  findExistingEdge,
} from '@views/topology/utils/dataTransformation/dataTransformation';
import {
  getPodNADReferences,
  getVMNADReferences,
  podUsesUDN,
} from '@views/topology/utils/filteringUtils';
import { vmUsesUDN } from '@views/udns/details/hooks/useUDNVirtualMachines/utils/utils';

export const getResourceID = (resource: K8sResourceCommon): string => {
  const namespace = getNamespace(resource) || 'cluster';
  const name = getName(resource) || 'unknown';
  const kind = resource.kind || 'unknown';
  return `${kind}-${namespace}-${name}`;
};

export const extractIngressBackends = (ingress: IoK8sApiNetworkingV1Ingress): string[] => {
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

export const extractRouteBackends = (route: RouteKind): string[] => {
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

export const extractMultiNetworkPolicyNADs = (
  policy: IoK8sApiNetworkingV1NetworkPolicy,
): string[] => {
  const annotation = getAnnotations(policy)?.[MULTI_NETWORK_POLICY_NADS_ANNOTATION_KEY];
  if (!annotation) return [];

  return annotation
    .split(',')
    .map((nad) => nad.trim())
    .filter(Boolean);
};

export const addServiceNodes = (
  services: IoK8sApiCoreV1Service[],
  nodes: NodeModel[],
  nodeMap: Map<string, NodeModel>,
) =>
  services?.forEach((service: IoK8sApiCoreV1Service) => {
    const id = getResourceID(service);
    const node = createNode(service, ResourceType.Service, 1, { badge: 'SVC' });
    nodes.push(node);
    nodeMap.set(id, node);
  });

export const addNetworkAttachmentDefinitionNodes = (
  nads: NetworkAttachmentDefinitionKind[],
  nodes: NodeModel[],
  nodeMap: Map<string, NodeModel>,
) =>
  nads?.forEach((nad: NetworkAttachmentDefinitionKind) => {
    const id = getResourceID(nad);
    const node = createNode(nad, ResourceType.NetworkAttachmentDefinition, 2, {
      badge: 'NAD',
    });
    nodes.push(node);
    nodeMap.set(id, node);
  });

export const addIngressNodesAndEdges = (
  ingresses: IoK8sApiNetworkingV1Ingress[],
  nodes: NodeModel[],
  edges: EdgeModel[],
  nodeMap: Map<string, NodeModel>,
) =>
  ingresses?.forEach((ingress: IoK8sApiNetworkingV1Ingress) => {
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

export const addRouteNodesAndEdges = (
  routes: RouteKind[],
  nodes: NodeModel[],
  edges: EdgeModel[],
  nodeMap: Map<string, NodeModel>,
) =>
  routes?.forEach((route: RouteKind) => {
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

export const addNetworkPolicyNodes = (
  networkPolicies: IoK8sApiNetworkingV1NetworkPolicy[],
  nodes: NodeModel[],
  nodeMap: Map<string, NodeModel>,
) =>
  networkPolicies?.forEach((policy: IoK8sApiNetworkingV1NetworkPolicy) => {
    const id = getResourceID(policy);
    const node = createNode(policy, ResourceType.NetworkPolicy, 4, {
      badge: 'NP',
      isDerivedFromPolicy: true,
    });
    nodes.push(node);
    nodeMap.set(id, node);
  });

export const addMultiNetworkPolicyNodesAndEdges = (
  multiNetworkPolicies: IoK8sApiNetworkingV1NetworkPolicy[],
  nodes: NodeModel[],
  edges: EdgeModel[],
  nodeMap: Map<string, NodeModel>,
) =>
  multiNetworkPolicies?.forEach((policy: IoK8sApiNetworkingV1NetworkPolicy) => {
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

export const addUserDefinedNetworkNodesAndEdges = (
  udns: UserDefinedNetworkKind[],
  nodes: NodeModel[],
  edges: EdgeModel[],
  nodeMap: Map<string, NodeModel>,
  pods: IoK8sApiCoreV1Pod[],
  vms: V1VirtualMachine[],
  nads: NetworkAttachmentDefinitionKind[],
) =>
  udns?.forEach((udn: UserDefinedNetworkKind) => {
    const id = getResourceID(udn);
    const node = createNode(udn, ResourceType.UserDefinedNetwork, 3, { badge: 'UDN' });
    nodes.push(node);
    nodeMap.set(id, node);

    const udnName = getName(udn);
    const udnNamespace = getNamespace(udn);

    nads?.forEach((nad) => {
      const nadName = getName(nad);
      const nadNamespace = getNamespace(nad);

      if (nadName === udnName && nadNamespace === udnNamespace) {
        const nadID = getResourceID(nad);
        const nadNode = nodeMap.get(nadID);
        if (nadNode && id !== nadID) {
          const existingEdge = findExistingEdge(edges, id, nadID);
          if (!existingEdge) {
            edges.push(createEdge(id, nadID, RelationshipType.UDNToNAD));
          }
        }
      }
    });

    pods?.forEach((pod) => {
      if (podUsesUDN(pod, udn)) {
        const podID = getResourceID(pod);
        const podNode = nodeMap.get(podID);
        if (podNode && id !== podID) {
          const existingEdge = findExistingEdge(edges, id, podID);
          if (!existingEdge) {
            edges.push(createEdge(id, podID, RelationshipType.UDNToPod));
          }
        }
      }
    });

    vms?.forEach((vm) => {
      if (vmUsesUDN(vm, udn)) {
        const vmID = getResourceID(vm);
        const vmNode = nodeMap.get(vmID);
        if (vmNode && id !== vmID) {
          const existingEdge = findExistingEdge(edges, id, vmID);
          if (!existingEdge) {
            edges.push(createEdge(id, vmID, RelationshipType.UDNToVM));
          }
        }
      }
    });
  });

export const addClusterUserDefinedNetworkNodesAndEdges = (
  clusterUDNs: ClusterUserDefinedNetworkKind[],
  nodes: NodeModel[],
  edges: EdgeModel[],
  nodeMap: Map<string, NodeModel>,
  pods: IoK8sApiCoreV1Pod[],
  vms: V1VirtualMachine[],
  nads: NetworkAttachmentDefinitionKind[],
) =>
  clusterUDNs?.forEach((cudn: ClusterUserDefinedNetworkKind) => {
    const id = getResourceID(cudn);
    const node = createNode(cudn, ResourceType.ClusterUserDefinedNetwork, 3, {
      badge: 'CUDN',
    });
    nodes.push(node);
    nodeMap.set(id, node);

    const cudnName = getName(cudn);
    const candidateNames = [
      cudnName,
      `${CLUSTER_UDN_NAD_NAME_PREFIX}${cudnName}`,
      `cluster-udn-${cudnName}`,
    ];

    nads?.forEach((nad) => {
      const nadName = getName(nad);

      if (candidateNames.includes(nadName)) {
        const nadID = getResourceID(nad);
        const nadNode = nodeMap.get(nadID);
        if (nadNode && id !== nadID) {
          const existingEdge = findExistingEdge(edges, id, nadID);
          if (!existingEdge) {
            edges.push(createEdge(id, nadID, RelationshipType.CUDNToNAD));
          }
        }
      }
    });

    pods?.forEach((pod) => {
      if (podUsesUDN(pod, cudn)) {
        const podID = getResourceID(pod);
        const podNode = nodeMap.get(podID);
        if (podNode && id !== podID) {
          const existingEdge = findExistingEdge(edges, id, podID);
          if (!existingEdge) {
            edges.push(createEdge(id, podID, RelationshipType.CUDNToPod));
          }
        }
      }
    });

    vms?.forEach((vm) => {
      if (vmUsesUDN(vm, cudn)) {
        const vmID = getResourceID(vm);
        const vmNode = nodeMap.get(vmID);
        if (vmNode && id !== vmID) {
          const existingEdge = findExistingEdge(edges, id, vmID);
          if (!existingEdge) {
            edges.push(createEdge(id, vmID, RelationshipType.CUDNToVM));
          }
        }
      }
    });
  });

export const addPodNodesAndEdges = (
  pods: IoK8sApiCoreV1Pod[],
  nodes: NodeModel[],
  edges: EdgeModel[],
  nodeMap: Map<string, NodeModel>,
) =>
  pods?.forEach((pod: IoK8sApiCoreV1Pod) => {
    const id = getResourceID(pod);
    const node = createNode(pod, ResourceType.Pod, 5, { badge: 'POD' });
    nodes.push(node);
    nodeMap.set(id, node);

    const nadReferences = getPodNADReferences(pod);
    nadReferences.forEach((nadRef) => {
      const [nadNamespace, nadName] = nadRef.split('/');
      const nadID = `NetworkAttachmentDefinition-${nadNamespace}-${nadName}`;
      const nadNode = nodeMap.get(nadID);

      if (nadNode && id !== nadID) {
        const existingEdge = findExistingEdge(edges, id, nadID);
        if (!existingEdge) {
          edges.push(createEdge(id, nadID, RelationshipType.PodToNAD));
        }
      }
    });
  });

export const addVirtualMachineNodesAndEdges = (
  vms: V1VirtualMachine[],
  nodes: NodeModel[],
  edges: EdgeModel[],
  nodeMap: Map<string, NodeModel>,
) =>
  vms?.forEach((vm: V1VirtualMachine) => {
    const id = getResourceID(vm);
    const node = createNode(vm, ResourceType.VirtualMachine, 5, { badge: 'VM' });
    nodes.push(node);
    nodeMap.set(id, node);

    const nadReferences = getVMNADReferences(vm);
    nadReferences.forEach((nadRef) => {
      const [nadNamespace, nadName] = nadRef.split('/');
      const nadID = `NetworkAttachmentDefinition-${nadNamespace}-${nadName}`;
      const nadNode = nodeMap.get(nadID);

      if (nadNode && id !== nadID) {
        const existingEdge = findExistingEdge(edges, id, nadID);
        if (!existingEdge) {
          edges.push(createEdge(id, nadID, RelationshipType.VirtualMachineToNAD));
        }
      }
    });
  });
