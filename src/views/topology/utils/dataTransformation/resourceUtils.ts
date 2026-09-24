import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { EdgeModel, NodeModel } from '@patternfly/react-topology';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getName, getNamespace } from '@utils/resources/shared';
import { CLUSTER_UDN_NAD_NAME_PREFIX } from '@utils/resources/udns/constants';
import { getCUDNNamespaceNames } from '@utils/resources/udns/helper';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { vmUsesUDN } from '@utils/resources/vm/utils';
import { RelationshipType, ResourceType } from '@views/topology/utils/constants';
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

export const getResourceID = (resource: K8sResourceCommon): string => {
  const namespace = getNamespace(resource) || 'cluster';
  const name = getName(resource) || 'unknown';
  const kind = resource.kind || 'unknown';
  return `${kind}-${namespace}-${name}`;
};

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
  projects?: K8sResourceCommon[],
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

    const cudnNamespaces = getCUDNNamespaceNames(cudn, projects);

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
      if (vmUsesUDN(vm, cudn, cudnNamespaces)) {
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
