export enum NetworkTypeKeys {
  cnvBridgeNetworkType = 'bridge',
  ovnKubernetesNetworkType = 'ovn-k8s-cni-overlay',
  ovnKubernetesSecondaryLocalnet = 'ovn-k8s-cni-overlay-localnet',
  sriovNetworkType = 'sriov',
}

export enum ovnK8sTopologyKeys {
  ovnK8sLayer = 'layer2',
  ovnK8sLocalnet = 'localnet',
}

export type NetworkTypeKeysType =
  | NetworkTypeKeys.cnvBridgeNetworkType
  | NetworkTypeKeys.ovnKubernetesNetworkType
  | NetworkTypeKeys.ovnKubernetesSecondaryLocalnet
  | NetworkTypeKeys.sriovNetworkType;

export const networkTypes: Record<NetworkTypeKeysType, string> = {
  [NetworkTypeKeys.cnvBridgeNetworkType]: 'Linux bridge',
  [NetworkTypeKeys.ovnKubernetesNetworkType]: 'OVN Kubernetes L2 overlay network',
  [NetworkTypeKeys.ovnKubernetesSecondaryLocalnet]: 'OVN Kubernetes secondary localnet network',
  [NetworkTypeKeys.sriovNetworkType]: 'SR-IOV',
};

export type NetworkAttachmentDefinitionFormInput = {
  [NetworkTypeKeys.cnvBridgeNetworkType]?: {
    bridge: string;
    macspoofchk?: boolean;
    vlanTagNum?: string;
  };
  [NetworkTypeKeys.ovnKubernetesSecondaryLocalnet]?: {
    bridgeMapping: string;
    mtu?: string;
    vlanID?: string;
  };
  [NetworkTypeKeys.sriovNetworkType]?: {
    ipam?: string;
    resourceName: string;
    vlanTagNum?: string;
  };
  description?: string;
  name: string;
  networkType: string;
};
