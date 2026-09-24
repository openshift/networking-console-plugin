export enum TopologyViewTypes {
  namespace = 'namespace',
  network = 'network',
  node = 'node',
  owner = 'owner',
  resource = 'resource',
}

export enum ResourceType {
  ClusterUserDefinedNetwork = 'ClusterUserDefinedNetwork',
  Ingress = 'Ingress',
  MultiNetworkPolicy = 'MultiNetworkPolicy',
  NetworkAttachmentDefinition = 'NetworkAttachmentDefinition',
  NetworkPolicy = 'NetworkPolicy',
  Pod = 'Pod',
  Route = 'Route',
  Service = 'Service',
  UserDefinedNetwork = 'UserDefinedNetwork',
  VirtualMachine = 'VirtualMachine',
}

export enum RelationshipType {
  CUDNToNAD = 'cudn-to-nad',
  CUDNToPod = 'cudn-to-pod',
  CUDNToVM = 'cudn-to-vm',
  IngressToService = 'ingress-to-service',
  MultiNetworkPolicyToNAD = 'multi-network-policy-to-nad',
  PodToNAD = 'pod-to-nad',
  RouteToService = 'route-to-service',
  UDNToNAD = 'udn-to-nad',
  UDNToPod = 'udn-to-pod',
  UDNToVM = 'udn-to-vm',
  VirtualMachineToNAD = 'vm-to-nad',
}

export const TOPOLOGY_POSITION_LOCAL_STORAGE_KEY = 'topology-node-positions';

export const NODE_POSITIONING_EVENT = 'node-positioned';
export const GRAPH_POSITIONING_EVENT = 'graph-position-change';

export const NODE_DIAMETER = 70;
export const ICON_SIZE = 30;

export const GROUP = 'group';

export const MULTI_NETWORK_POLICY_NADS_ANNOTATION_KEY = 'k8s.v1.cni.cncf.io/policy-for';

export const L2_BRIDGE_BINDING_NAME = 'l2bridge';
