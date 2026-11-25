export interface DisplayOptionsState {
  compactView: boolean;
  hideManagementPorts: boolean;
  hideWorkloads: boolean;
  showLabels: boolean;
}

export enum TopologyGroupType {
  namespace = 'namespace',
  namespaceOwner = 'namespace-owner',
  none = 'none',
  owner = 'owner',
}

export enum TopologyDisplayMode {
  graph = 'graph',
  table = 'table',
}
