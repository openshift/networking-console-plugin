export const NODE_NETWORK_CONFIGURATION_WIZARD_PATH =
  '/node-network-configuration?createPolicy=true';
export const OPERATOR_HUB_NMSTATE_PATH = '/operatorhub/all-namespaces?keyword=nmstate';
export const PHYSICAL_NETWORK_NAME_PARAM_KEY = 'physicalNetworkName';
export const VM_NETWORK_NEW_PATH = '/k8s/cluster/virtualmachine-networks/~new';

export enum NetworksSearchType {
  Configurations = 'configurations',
  Name = 'name',
  Nodes = 'nodes',
}
