import assert from 'node:assert/strict';
import test from 'node:test';

import { BGPRouting, isCIDR, parseSelector } from '../../src/utils/resources/bgp';
import {
  cloudPayload,
  CloudValues,
  replaceFirstSelector,
  routingPayload,
  RoutingValues,
} from '../../src/views/bgp/form/BGPFormUtils';

const cloudValues: CloudValues = {
  awsRegion: 'us-east-1',
  awsRouteServerIDs: 'rs-1, rs-2',
  azureResourceGroup: '',
  azureRouteServerName: '',
  azureSubscriptionID: '',
  cloudRouterName: '',
  ebgpMultiHop: false,
  enableNestedVirtualization: false,
  gcpNCCHubName: '',
  gcpNCCSpokePrefix: '',
  gcpProject: '',
  gcpRegion: '',
  livenessDetection: 'bgp-keepalive',
  localASN: '64512',
  neighborAddress: '192.0.2.1',
  peerSelectorKey: 'node-role.kubernetes.io/bgp',
  peerSelectorValue: 'router',
  platform: 'Manual',
  remoteASN: '64513',
  routerSelectorKey: 'node-role.kubernetes.io/bgp',
  routerSelectorValue: 'router',
};

test('replaceFirstSelector replaces only the guided selector entry', () => {
  assert.deepEqual(
    replaceFirstSelector(
      { environment: 'production', region: 'east', role: 'old' },
      'node-role.kubernetes.io/bgp',
      'router',
    ),
    { 'node-role.kubernetes.io/bgp': 'router', region: 'east', role: 'old' },
  );
});

test('selector parsing preserves empty values', () => {
  assert.deepEqual(parseSelector('k8s.ovn.org/primary-user-defined-network='), {
    'k8s.ovn.org/primary-user-defined-network': '',
  });
  assert.deepEqual(
    replaceFirstSelector(
      Object.fromEntries([
        ['role', 'old'],
        ['region', 'east'],
      ]),
      'role',
      '',
    ),
    {
      region: 'east',
      role: '',
    },
  );
});

test('cloudPayload preserves manual peer groups, neighbors, selectors, and metadata', () => {
  const original: { spec: { otherField: string } & BGPRouting['spec'] } & BGPRouting = {
    apiVersion: 'networking.openshift.io/v1beta1',
    kind: 'BGPCloudConfiguration',
    metadata: { name: 'cluster', resourceVersion: '12' },
    spec: {
      bgp: {
        localASN: 64500,
        peerGroups: [
          {
            neighbors: [
              { address: '192.0.2.10', remoteASN: 64501 },
              { address: '192.0.2.11', remoteASN: 64502 },
            ],
            nodeSelector: { role: 'router', zone: 'east' },
          },
          {
            neighbors: [{ address: '198.51.100.10', remoteASN: 64503 }],
            nodeSelector: { role: 'backup' },
          },
        ],
      },
      platform: 'Manual' as const,
      routerNodeSelector: { role: 'router', zone: 'east' },
    },
  };

  const payload = cloudPayload(cloudValues, original);

  assert.equal(payload.metadata.resourceVersion, '12');
  assert.deepEqual(payload.spec.routerNodeSelector, {
    'node-role.kubernetes.io/bgp': 'router',
    zone: 'east',
  });
  assert.deepEqual(payload.spec.bgp.peerGroups, [
    {
      neighbors: [
        { address: '192.0.2.1', ebgpMultiHop: false, remoteASN: 64513 },
        { address: '192.0.2.11', remoteASN: 64502 },
      ],
      nodeSelector: { 'node-role.kubernetes.io/bgp': 'router', zone: 'east' },
    },
    original.spec.bgp.peerGroups[1],
  ]);
});

test('cloudPayload creates a manual peer group when none exists', () => {
  const payload = cloudPayload(cloudValues);

  assert.deepEqual(payload.spec.bgp.peerGroups, [
    {
      neighbors: [{ address: '192.0.2.1', ebgpMultiHop: false, remoteASN: 64513 }],
      nodeSelector: { 'node-role.kubernetes.io/bgp': 'router' },
    },
  ]);
});

test('routingPayload preserves metadata and unedited spec fields', () => {
  const data: RoutingValues = {
    name: 'prod-routing',
    network: 'prod',
    subnet1: '10.20.0.0/16',
    subnet2: '2001:db8:20::/64',
  };
  const original = {
    apiVersion: 'networking.openshift.io/v1beta1',
    kind: 'BGPRouting',
    metadata: { labels: { owner: 'test' }, name: 'prod-routing', resourceVersion: '8' },
    spec: { network: { name: 'old', subnets: ['10.0.0.0/16'] }, otherField: 'preserve' },
  };

  assert.deepEqual(routingPayload(data, original), {
    apiVersion: 'networking.openshift.io/v1beta1',
    kind: 'BGPRouting',
    metadata: { labels: { owner: 'test' }, name: 'prod-routing', resourceVersion: '8' },
    spec: {
      network: { name: 'prod', subnets: ['10.20.0.0/16', '2001:db8:20::/64'] },
      otherField: 'preserve',
    },
  });
});

test('isCIDR accepts IPv4 and IPv6 prefixes and rejects invalid values', () => {
  assert.equal(isCIDR('10.20.0.0/16'), true);
  assert.equal(isCIDR('2001:db8:20::/64'), true);
  assert.equal(isCIDR('10.20.0.0/33'), false);
  assert.equal(isCIDR('abc.def/24'), false);
  assert.equal(isCIDR('2001:db8:1:2:3:4:5:6:/64'), false);
  assert.equal(isCIDR('2001:db8:::1/64'), false);
  assert.equal(isCIDR('not-a-cidr'), false);
});
