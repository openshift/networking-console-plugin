import { K8sResourceKind, Selector } from '@openshift-console/dynamic-plugin-sdk';

export type UserDefinedNetworkAnnotations = {
  description?: string;
};

export enum UserDefinedNetworkRole {
  Primary = 'Primary',
  Secondary = 'Secondary',
}

export type UserDefinedNetworkLayer2 = {
  ipam?: {
    lifecycle?: string;
  };
  joinSubnets?: string[];
  mtu?: number;
  role: UserDefinedNetworkRole;
  subnets?: string[];
};

export type UserDefinedNetworkLayer3Subnet = {
  cidr: string;
  hostSubnet?: number;
};

export type UserDefinedNetworkSubnet = string | UserDefinedNetworkLayer3Subnet;

export type UserDefinedNetworkLayer3 = {
  joinSubnets?: string[];
  mtu?: number;
  role: UserDefinedNetworkRole;
  subnets?: UserDefinedNetworkLayer3Subnet[];
};

export type ClusterUserDefinedNetworkSpec = {
  namespaceSelector?: Selector;
  network?: UserDefinedNetworkSpec;
};

export type UserDefinedNetworkSpec = {
  layer2?: UserDefinedNetworkLayer2;
  layer3?: UserDefinedNetworkLayer3;
  localnet?: {
    physicalNetworkName: string;
    role: UserDefinedNetworkRole;
    subnets?: UserDefinedNetworkSubnet[];
  };
  topology: string;
};

export type ClusterUserDefinedNetworkKind = {
  spec?: ClusterUserDefinedNetworkSpec;
} & K8sResourceKind;

export type UserDefinedNetworkKind = {
  spec?: UserDefinedNetworkSpec;
} & K8sResourceKind;
