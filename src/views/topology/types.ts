import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

export interface NMStateInterface {
  bridge?: {
    port?: { name: string }[];
  };
  ipv4?: {
    address?: { ip: string; 'prefix-length': number }[];
    enabled?: boolean;
  };
  ipv6?: {
    address?: { ip: string; 'prefix-length': number }[];
    enabled?: boolean;
  };
  lldp?: {
    enabled?: boolean;
    neighbors?: Record<string, unknown>[][];
  };
  'mac-address'?: string;
  mtu?: number;
  name: string;
  state?: string;
  type?: string;
}

export interface NodeNetworkStateKind extends K8sResourceCommon {
  status?: {
    currentState?: {
      interfaces?: NMStateInterface[];
    };
  };
}

export interface DisplayOptionsState {
  compactView: boolean;
  hideManagementPorts: boolean;
  hideWorkloads: boolean;
  showLabels: boolean;
}

export enum TopologyDisplayMode {
  graph = 'graph',
  table = 'table',
}
