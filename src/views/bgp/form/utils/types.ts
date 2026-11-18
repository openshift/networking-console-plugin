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
