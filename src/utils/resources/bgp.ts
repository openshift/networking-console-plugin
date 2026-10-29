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
      .filter(([key]) => key),
  );

const isValidIPv4 = (address: string) => {
  const octets = address.split('.');
  return (
    octets.length === 4 && octets.every((octet) => /^\d+$/.test(octet) && Number(octet) <= 255)
  );
};

const isValidIPv6 = (address: string) => {
  let normalized = address.toLowerCase();
  if (normalized.includes('.')) {
    const lastColon = normalized.lastIndexOf(':');
    const ipv4 = normalized.slice(lastColon + 1);
    if (lastColon < 0 || !isValidIPv4(ipv4)) return false;
    const octets = ipv4.split('.').map(Number);
    const mappedIPv4 = [
      ((octets[0] << 8) | octets[1]).toString(16),
      ((octets[2] << 8) | octets[3]).toString(16),
    ].join(':');
    normalized = `${normalized.slice(0, lastColon + 1)}${mappedIPv4}`;
  }
  if (!/^[0-9a-f:]+$/.test(normalized)) return false;
  if (normalized.includes(':::')) return false;
  const doubleColonCount = (normalized.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;
  if (doubleColonCount === 0 && (normalized.startsWith(':') || normalized.endsWith(':')))
    return false;
  const groups = normalized.split(':');
  if (groups.some((group) => group.length > 4)) return false;
  const groupCount = groups.filter(Boolean).length;
  return doubleColonCount === 1 ? groupCount < 8 : groupCount === 8;
};

export const isCIDR = (value: string) => {
  const parts = value.trim().split('/');
  if (parts.length !== 2) return false;
  const [address, prefix] = parts;
  if (!address || !/^\d+$/.test(prefix)) return false;
  const prefixNumber = Number(prefix);
  return (
    (isValidIPv4(address) && prefixNumber <= 32) || (isValidIPv6(address) && prefixNumber <= 128)
  );
};
