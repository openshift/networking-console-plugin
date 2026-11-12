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
