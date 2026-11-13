import type {
  K8sResourceCommon,
  K8sResourceCondition,
} from '@openshift-console/dynamic-plugin-sdk';

export type BGPNeighbor = { address: string; ebgpMultiHop?: boolean; remoteASN: number };

export type PeerGroup = {
  neighbors: BGPNeighbor[];
  nodeSelector?: Record<string, string>;
};

export type PeerGroupStatus = { key: string } & PeerGroup;

export type BGPCondition = { observedGeneration?: number } & K8sResourceCondition;

export type BGPCloudConfiguration = {
  spec: {
    aws?: { region: string; routeServerIDs: string[] };
    azure?: {
      networkInterfaceClientID?: string;
      resourceGroup: string;
      routeServerName: string;
      subscriptionID: string;
    };
    bgp: {
      livenessDetection?: 'bfd' | 'bgp-keepalive';
      localASN: number;
      peerGroups?: PeerGroup[];
    };
    gcp?: {
      cloudRouterName: string;
      enableNestedVirtualization?: boolean;
      ncc: { hubName: string; siteToSiteDataTransfer?: boolean; spokePrefix: string };
      project: string;
      region: string;
    };
    platform: 'AWS' | 'Azure' | 'GCP' | 'Manual';
    routerNodeSelector: Record<string, string>;
  };
  status?: {
    conditions?: BGPCondition[];
    observedGeneration?: number;
    peerGroups?: PeerGroupStatus[];
    phase?: string;
  };
} & K8sResourceCommon;

export type BGPRouting = {
  spec: { network: { name: string; subnets: string[] } };
  status?: {
    conditions?: BGPCondition[];
    observedGeneration?: number;
    phase?: string;
  };
} & K8sResourceCommon;
