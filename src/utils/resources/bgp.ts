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
    namespaces?: string[];
    observedGeneration?: number;
    phase?: string;
  };
} & K8sResourceCommon;

export const BGP_ROUTE_ADVERTISEMENTS_NAME = 'bgp-cc-route-advertisements';

export const condition = (conditions: BGPCondition[] = [], type = 'Available') =>
  conditions.find((item) => item.type === type);

export const selectorText = (selector?: Record<string, string>) =>
  Object.entries(selector || {})
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');

export const parseSelector = (value: string): Record<string, string> =>
  Object.fromEntries(
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split('=');
        return [key.trim(), rest.join('=').trim()];
      })
      .filter(([key, val]) => key && val),
  );

export const isCIDR = (value: string) => {
  const [address, prefix] = value.trim().split('/');
  const prefixNumber = Number(prefix);
  const isV4 = address?.includes('.') && prefixNumber >= 0 && prefixNumber <= 32;
  const isV6 = address?.includes(':') && prefixNumber >= 0 && prefixNumber <= 128;
  return Boolean((isV4 || isV6) && address);
};
