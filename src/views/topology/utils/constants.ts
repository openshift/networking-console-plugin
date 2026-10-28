import { DisplayOptionsState } from '@views/topology/types';

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

export const TOPOLOGY_RESOURCE_TYPES_PARAM = 'resourceTypes';
export const TOPOLOGY_SEARCH_QUERY_PARAM = 'searchQuery';
export const TOPOLOGY_ADVANCED_FILTERS_PARAM = 'advancedFilters';
export const TOPOLOGY_FILTER_MATCH_PARAM = 'filterMatch';

export const NODE_DIAMETER = 70;
export const ICON_SIZE = 30;

export const GROUP = 'group';

export enum FilterAttribute {
  Destination = 'Destination',
  Endpoint = 'Endpoint',
  ICMP = 'ICMP',
  IP = 'IP',
  Kind = 'Kind',
  MAC = 'MAC',
  Name = 'Name',
  Namespace = 'Namespace',
  Source = 'Source',
}

export enum FilterMatchType {
  AND = 'AND',
  OR = 'OR',
}

export enum FilterOperator {
  Contains = 'contains',
  Equals = 'equals',
  NotEquals = 'not equals',
}

export const DEFAULT_DISPLAY_OPTIONS: DisplayOptionsState = {
  compactView: true,
  hideManagementPorts: false,
  hideWorkloads: false,
  showLabels: true,
};

export const MULTI_NETWORK_POLICY_NADS_ANNOTATION_KEY = 'k8s.v1.cni.cncf.io/policy-for';

export const L2_BRIDGE_BINDING_NAME = 'l2bridge';

export enum TopologyLayoutType {
  BreadthFirst = 'BreadthFirst',
  Cola = 'Cola',
  Concentric = 'Concentric',
  Dagre = 'Dagre',
  Force = 'Force',
  Grid = 'Grid',
  Levels = 'Levels',
}

export const DEFAULT_TOPOLOGY_LAYOUT = TopologyLayoutType.Dagre;

export const TOPOLOGY_LAYOUT_PARAM = 'layout';
