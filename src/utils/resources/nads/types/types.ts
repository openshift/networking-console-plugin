import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

export const RESOURCE_NAME_ANNOTATION = 'k8s.v1.cni.cncf.io/resourceName';

export type NetworkAttachmentDefinitionAnnotations = {
  description?: string;
  [RESOURCE_NAME_ANNOTATION]?: string;
};

export type IPAMConfig = {
  dataDir?: string;
  subnet?: string;
  type?: string;
};

export type NetworkAttachmentDefinitionPlugin = {
  [key: string]: any;
};

export type NetworkAttachmentDefinitionConfig = {
  bridge?: string;
  cniVersion: string;
  excludeSubnets?: string;
  ipam?: IPAMConfig;
  isGateway?: true;
  macspoofchk?: boolean;
  mtu?: number;
  name: string;
  netAttachDefName?: string;
  plugins?: NetworkAttachmentDefinitionPlugin[];
  preserveDefaultVlan?: boolean;
  role?: string;
  subnets?: string;
  topology?: string;
  type?: string;
  vlan?: number;
  vlanID?: number;
};

// The config is a JSON object with the NetworkAttachmentDefinitionConfig type stored as a string
export type NetworkAttachmentDefinitionSpec = {
  config: string;
};

export type NetworkAttachmentDefinitionKind = {
  spec?: NetworkAttachmentDefinitionSpec;
} & K8sResourceKind;
