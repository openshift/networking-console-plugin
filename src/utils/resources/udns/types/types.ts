import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

export type UserDefinedNetworkSpec = {
  layer2: {
    ipamLifecycle: string;
    mtu: number;
    role: string;
    subnets: string[];
  };
  layer3: {
    joinSubnets: string[];
    mtu: number;
    role: string;
    subnets: {
      cidr: string;
      hostSubnet: number;
    }[];
  };
  topology: string;
};

export type UserDefinedNetworkKind = {
  spec?: UserDefinedNetworkSpec;
} & K8sResourceKind;
