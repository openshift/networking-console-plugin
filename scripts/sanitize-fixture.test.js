/* Regression tests for scripts/sanitize-fixture.js. The CLI is spawned rather
 * than required, so the fail-closed paths (exit status and stderr) are covered
 * through the same entry point the recorder calls. */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const { test } = require('node:test');

const SANITIZER = join(__dirname, 'sanitize-fixture.js');

const run = (
  payload,
  { clusterTokens = 'api.cluster.example.com', nodeTokens = 'worker-0' } = {},
) =>
  spawnSync(process.execPath, [SANITIZER], {
    cwd: join(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      SANITIZE_CLUSTER_TOKENS: clusterTokens,
      SANITIZE_NODE_TOKENS: nodeTokens,
    },
    input: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });

test('a node name inside a composite value is aliased', () => {
  const result = run({
    kind: 'NodeNetworkConfigurationPolicy',
    metadata: { name: 'patch-br-ex_worker-0-to-br-int' },
    spec: {},
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).metadata.name, 'patch-br-ex_node-1-to-br-int');
});

test('a token only matches where it stands alone', () => {
  const result = run({ data: { iface: 'ethernet' }, kind: 'ConfigMap' }, { nodeTokens: 'net' });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).data.iface, 'ethernet');
});

test('a node name surviving as a JSON key fails the recording', () => {
  const result = run({ kind: 'ConfigMap', net: 'x' }, { nodeTokens: 'net' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /node name/);
});

test('missing identity tokens fail closed', () => {
  const result = run({ kind: 'ConfigMap' }, { clusterTokens: '', nodeTokens: '' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /must both be non-empty/);
});

test('an empty required list fails the recording', () => {
  const result = run({ items: [], kind: 'ServiceList' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /ServiceList is empty/);
});

test('an empty allow-listed list passes', () => {
  const result = run({ items: [], kind: 'MultiNetworkPolicyList' });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { items: [], kind: 'MultiNetworkPolicyList' });
});

test('an unowned cluster-scoped object does not echo its name', () => {
  const result = run({
    items: [
      {
        apiVersion: 'k8s.ovn.org/v1',
        kind: 'ClusterUserDefinedNetwork',
        metadata: { name: 'customer-net' },
      },
    ],
    kind: 'ClusterUserDefinedNetworkList',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /the suite does not own/);
  assert.doesNotMatch(result.stderr, /customer-net/);
});

test('a cluster-scoped object is owned by its label, not by its name', () => {
  // `test-cudn-other-team` matched the old name-prefix allow-list; only the label
  // the suite's seeds carry may grant ownership now.
  const unlabelled = run({
    items: [
      {
        apiVersion: 'k8s.ovn.org/v1',
        kind: 'ClusterUserDefinedNetwork',
        metadata: { name: 'test-cudn-other-team' },
      },
    ],
    kind: 'ClusterUserDefinedNetworkList',
  });
  assert.equal(unlabelled.status, 1);
  assert.doesNotMatch(unlabelled.stderr, /test-cudn-other-team/);

  const labelled = run({
    items: [
      {
        apiVersion: 'k8s.ovn.org/v1',
        kind: 'ClusterUserDefinedNetwork',
        metadata: {
          labels: { 'app.kubernetes.io/managed-by': 'networking-console-plugin-test' },
          name: 'some-other-name',
        },
      },
    ],
    kind: 'ClusterUserDefinedNetworkList',
  });
  assert.equal(labelled.status, 0, labelled.stderr);
});

test('a foreign namespace does not echo its name', () => {
  const result = run({
    items: [{ kind: 'Pod', metadata: { name: 'web', namespace: 'cy-test-ns-other' } }],
    kind: 'PodList',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /outside the suite allow-list/);
  assert.doesNotMatch(result.stderr, /cy-test-ns-other/);
});

test('a MAC address becomes the documentation placeholder', () => {
  const result = run({ data: { macAddress: 'aa:bb:cc:dd:ee:ff' }, kind: 'ConfigMap' });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).data.macAddress, '02:00:00:00:00:01');
});

test('a compressed IPv6 address in an unlisted field is replaced', () => {
  // `fd00::beef` slipped past the previous pattern, which required a hex group
  // after every colon, so it reached the fixture unchanged.
  const result = run({
    data: { 'next-hop-address': 'fd00::beef' },
    kind: 'NodeNetworkConfigurationPolicy',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).data['next-hop-address'], '2001:db8::10');
});

test('a compressed IPv6 address surviving as a JSON key fails the recording', () => {
  const result = run({ 'fd00::1': 'x', kind: 'ConfigMap' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /IPv6 address/);
});

test('an unseeded pod fails the recording', () => {
  const result = run({
    items: [{ kind: 'Pod', metadata: { name: 'intruder', namespace: 'cy-test-ns' } }],
    kind: 'PodList',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /pod the suite does not own/);
  assert.doesNotMatch(result.stderr, /intruder/);
});

test('the seeded pods pass the recording', () => {
  const result = run({
    items: ['web-1', 'web-2', 'other-1'].map((name) => ({
      kind: 'Pod',
      metadata: { name, namespace: 'cy-test-ns' },
    })),
    kind: 'PodList',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    JSON.parse(result.stdout).items.map((item) => item.metadata.name),
    ['web-1', 'web-2', 'other-1'],
  );
});

test('an inline Route TLS key fails the recording', () => {
  const result = run({
    apiVersion: 'route.openshift.io/v1',
    kind: 'Route',
    metadata: { name: 'tls', namespace: 'cy-test-ns' },
    spec: { tls: { key: '-----BEGIN RSA PRIVATE KEY-----\n' } },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /inline Route TLS private key/);
});

test('a private key outside a Route fails the self-check', () => {
  const result = run({
    data: { key: '-----BEGIN RSA PRIVATE KEY-----\n' },
    kind: 'ConfigMap',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /private key/);
});

test('an IPv6 address inside a structured value keeps its surroundings', () => {
  // Replacing the whole value dropped the JSON a NAD config carries; the seed
  // stores spec.config as a JSON string, so this form is expected.
  const result = run({
    data: { config: '{"subnets":"fd00::/64","topology":"layer3"}' },
    kind: 'ConfigMap',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    JSON.parse(result.stdout).data.config,
    '{"subnets":"2001:db8::10/64","topology":"layer3"}',
  );
});

test('every address in a structured value is replaced', () => {
  // A NAD config holds a subnet and its gateway, and an IPAM block can list
  // several; replacing only the first left the rest for the self-check, which
  // then refused a recording that had nothing wrong with it.
  const result = run({
    data: {
      config:
        '{"subnet":"fd00::/64","excludeSubnets":["fd00::1/128"],' +
        '"ranges":[{"subnet":"10.1.2.0/24","gateway":"10.1.2.1"}]}',
      macs: 'aa:bb:cc:dd:ee:ff 11:22:33:44:55:66',
      single: 'fd00::beef',
    },
    kind: 'ConfigMap',
  });

  assert.equal(result.status, 0, result.stderr);
  const { config, macs, single } = JSON.parse(result.stdout).data;
  assert.equal(
    config,
    '{"subnet":"2001:db8::10/64","excludeSubnets":["2001:db8::10/128"],' +
      '"ranges":[{"subnet":"192.0.2.10/24","gateway":"192.0.2.10"}]}',
  );
  assert.equal(macs, '02:00:00:00:00:01 02:00:00:00:00:01');
  assert.equal(single, '2001:db8::10');
});

test('a node keeps its alias in a payload that omits its peers', () => {
  // One process sanitizes each payload, so numbering by encounter order gave a
  // node one alias in the Node list and another in the NodeNetworkState list.
  const options = { nodeTokens: 'worker-0,worker-1' };

  const peerless = run(
    { kind: 'ConfigMap', metadata: { name: 'patch-br-ex_worker-1-to-br-int' } },
    options,
  );
  const withPeer = run(
    { kind: 'ConfigMap', metadata: { name: 'patch-br-ex_worker-0-to-br-int' } },
    options,
  );

  assert.equal(peerless.status, 0, peerless.stderr);
  assert.equal(JSON.parse(peerless.stdout).metadata.name, 'patch-br-ex_node-2-to-br-int');
  assert.equal(withPeer.status, 0, withPeer.stderr);
  assert.equal(JSON.parse(withPeer.stdout).metadata.name, 'patch-br-ex_node-1-to-br-int');
});
