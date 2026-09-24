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
  Route = 'Route',
  Service = 'Service',
  UserDefinedNetwork = 'UserDefinedNetwork',
}

export enum RelationshipType {
  IngressToService = 'ingress-to-service',
  MultiNetworkPolicyToNAD = 'multi-network-policy-to-nad',
  RouteToService = 'route-to-service',
}

export const TOPOLOGY_POSITION_LOCAL_STORAGE_KEY = 'topology-node-positions';

export const NODE_DIAMETER = 70;
export const ICON_SIZE = 30;

export const GROUP = 'group';

export const MULTI_NETWORK_POLICY_NADS_ANNOTATION_KEY = 'k8s.v1.cni.cncf.io/policy-for';
