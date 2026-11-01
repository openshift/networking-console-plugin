import { EnactmentState } from './types';

export const NODE_NETWORK_CONFIGURATION_WIZARD_PATH =
  '/node-network-configuration?createPolicy=true';
export const SOFTWARE_CATALOG_NMSTATE_PATH = '/catalog/all-namespaces?keyword=nmstate';
export const PHYSICAL_NETWORK_NAME_PARAM_KEY = 'physicalNetworkName';
export const VM_NETWORK_NEW_PATH = '/k8s/cluster/virtualmachine-networks/~new';

export const ENACTMENT_STATES: EnactmentState[] = [
  EnactmentState.Aborted,
  EnactmentState.Available,
  EnactmentState.Failing,
  EnactmentState.Pending,
  EnactmentState.Progressing,
];

export enum NetworksSearchType {
  Configurations = 'configurations',
  Name = 'name',
  Nodes = 'nodes',
}
