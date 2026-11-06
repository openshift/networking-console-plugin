import { BGPCloudConfiguration, BGPRouting, parseSelector } from '@utils/resources/bgp';

export type CloudValues = {
  awsRegion: string;
  awsRouteServerIDs: string;
  azureResourceGroup: string;
  azureRouteServerName: string;
  azureSubscriptionID: string;
  cloudRouterName: string;
  ebgpMultiHop: boolean;
  enableNestedVirtualization: boolean;
  gcpNCCHubName: string;
  gcpNCCSpokePrefix: string;
  gcpProject: string;
  gcpRegion: string;
  livenessDetection: 'bfd' | 'bgp-keepalive';
  localASN: number | string;
  neighborAddress: string;
  peerSelectorKey: string;
  peerSelectorValue: string;
  platform: 'AWS' | 'Azure' | 'GCP' | 'Manual';
  remoteASN: number | string;
  routerSelectorKey: string;
  routerSelectorValue: string;
};

export type RoutingValues = {
  name: string;
  network: string;
  subnet1: string;
  subnet2: string;
};

export const replaceFirstSelector = (
  selector: Record<string, string> | undefined,
  key: string,
  value: string,
) => {
  const guidedEntry = Object.entries(parseSelector(`${key}=${value}`))[0];
  return Object.fromEntries([
    ...(guidedEntry ? [guidedEntry] : []),
    ...Object.entries(selector || {}).slice(1),
  ]);
};

export const cloudPayload = (
  data: CloudValues,
  original?: BGPCloudConfiguration,
): BGPCloudConfiguration => {
  const spec: BGPCloudConfiguration['spec'] = {
    ...original?.spec,
    bgp: {
      ...original?.spec?.bgp,
      livenessDetection: data.livenessDetection,
      localASN: Number(data.localASN),
    },
    platform: data.platform,
    routerNodeSelector: replaceFirstSelector(
      original?.spec?.routerNodeSelector,
      data.routerSelectorKey,
      data.routerSelectorValue,
    ),
  };
  if (data.platform === 'AWS')
    spec.aws = {
      ...original?.spec?.aws,
      region: data.awsRegion,
      routeServerIDs: data.awsRouteServerIDs
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    };
  if (data.platform === 'Azure')
    spec.azure = {
      ...original?.spec?.azure,
      resourceGroup: data.azureResourceGroup,
      routeServerName: data.azureRouteServerName,
      subscriptionID: data.azureSubscriptionID,
    };
  if (data.platform === 'GCP')
    spec.gcp = {
      ...original?.spec?.gcp,
      cloudRouterName: data.cloudRouterName,
      enableNestedVirtualization: data.enableNestedVirtualization,
      ncc: { hubName: data.gcpNCCHubName, spokePrefix: data.gcpNCCSpokePrefix },
      project: data.gcpProject,
      region: data.gcpRegion,
    };
  if (data.platform === 'Manual') {
    const peerGroups = [...(original?.spec?.bgp?.peerGroups || [])];
    const firstPeerGroup = peerGroups[0] || { neighbors: [] };
    const neighbors = [...(firstPeerGroup.neighbors || [])];
    neighbors[0] = {
      ...(neighbors[0] || {}),
      address: data.neighborAddress,
      ebgpMultiHop: data.ebgpMultiHop,
      remoteASN: Number(data.remoteASN),
    };
    peerGroups[0] = {
      ...firstPeerGroup,
      neighbors,
      nodeSelector: replaceFirstSelector(
        firstPeerGroup.nodeSelector,
        data.peerSelectorKey,
        data.peerSelectorValue,
      ),
    };
    spec.bgp.peerGroups = peerGroups;
  }
  return {
    apiVersion: 'networking.openshift.io/v1beta1',
    kind: 'BGPCloudConfiguration',
    metadata: original?.metadata || { name: 'cluster' },
    spec,
  };
};

export const routingPayload = (data: RoutingValues, original?: BGPRouting): BGPRouting => ({
  apiVersion: 'networking.openshift.io/v1beta1',
  kind: 'BGPRouting',
  metadata: { ...original?.metadata, name: data.name },
  spec: {
    ...original?.spec,
    network: { name: data.network, subnets: [data.subnet1, data.subnet2].filter(Boolean) },
  },
});
