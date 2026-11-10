#!/usr/bin/env node
/* Prepares a recorded API payload for commit as a test fixture.
 *
 * The capture comes from a cluster where the user may be cluster-admin, so this
 * removes everything that identifies the environment before the JSON is tracked:
 * server bookkeeping, write-history annotations, node hostnames, addresses, and
 * any namespace other than the two the suite owns. It then re-scans its own
 * output and exits non-zero if anything identity-bearing survived, so a bad
 * recording fails the recorder instead of landing in the repository.
 */
const fs = require('node:fs');

const IDENTITY_FIELDS = [
  'uid',
  'resourceVersion',
  'generation',
  'creationTimestamp',
  'managedFields',
  'selfLink',
  'ownerReferences',
];

// Embeds the full object as submitted, including values that never appear in the
// live spec. Manager and user names come along with it.
const ANNOTATION_DENYLIST = new Set([
  'k8s.ovn.org/pod-networks',
  'k8s.v1.cni.cncf.io/network-status',
  'kubectl.kubernetes.io/last-applied-configuration',
  'openshift.io/created-at',
  'openshift.io/scc',
  'security.openshift.io/validated-scc-subject-type',
]);

// Only the namespaces this suite creates are allowed through; recording from a
// real project would otherwise commit that name.
const ALLOWED_NAMESPACES = new Set(['cy-test-ns', 'udn-test-ns']);

// The recorder captures the whole namespace. Only the Pods the seed script
// creates may reach the fixture, so another user's Pod cannot publish its image
// and labels.
const ALLOWED_POD_NAMES = new Set(['other-1', 'web-1', 'web-2']);

// Credentials never belong in a fixture, and the recorder should not be pointed
// at endpoints that return them.
const FORBIDDEN_KINDS = new Set(['Secret', 'SecretList']);

// A Route may carry its TLS key inline, and a PEM key must never be committed;
// scrubbing refuses a Route key, and the self-check catches any other kind.
const PRIVATE_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;

/* Detection and replacement are separate patterns: the detector runs once in the
 * self-check, while the token pattern replaces every occurrence, because a
 * structured value such as a NAD config carries more than one address and a
 * survivor aborts the recording. */
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
const IPV4_TOKEN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
/* Four or more hex groups, or any `::` compression. The older form required a hex
 * group after every colon, so `fd00::beef` passed both the scrubber and the
 * self-check. A `hh:mm:ss` clock has two groups and no `::`, so it is left alone. */
const IPV6 = /\b[a-f0-9]{0,4}(?::[a-f0-9]{0,4}){3,}\b|::/i;
/* The placeholder replaces the address token only, so a structured value such as
 * {"subnets":"fd00::/64"} keeps its JSON and its prefix. The lookarounds stop the
 * match at hex neighbours, which would otherwise fuse into the placeholder. */
const IPV6_TOKEN =
  /(?<![0-9a-f:])(?:[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){3,}|[0-9a-f]{0,4}::[0-9a-f]{0,4}(?::[0-9a-f]{0,4})*)(?![0-9a-f:])/gi;
/* A MAC address is six colon-separated hex pairs, which the IPV6 pattern above
 * also matches; it is checked first so `macAddress` keeps a MAC-shaped value. */
const MAC = /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i;
const MAC_TOKEN = /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/gi;
const CLUSTER_SUFFIX = /\.(?:internal|local|us|apps)\b/i;

/* Alternation in priority order, used with replace only: a MAC is IPv6-shaped, so
 * it must be tried first, and one pass keeps every replacement from being
 * re-examined. Never call test() on this pattern, which would advance lastIndex. */
const ADDRESS = new RegExp(
  `(${MAC_TOKEN.source})|(${IPV4_TOKEN.source})|(${IPV6_TOKEN.source})`,
  'gi',
);

const DOC_IPV4 = '192.0.2.10';
const DOC_IPV6 = '2001:db8::10';
const DOC_MAC = '02:00:00:00:00:01';

/* Tokens the recorder passes in: cluster-supplied strings that identify the
 * environment even when they appear inside composite values such as
 * "patch-br-ex_<node>-to-br-int". Substituted everywhere, then scanned for. */
const NODE_TOKENS = (process.env.SANITIZE_NODE_TOKENS ?? '')
  .split(',')
  .map((token) => token.trim())
  .filter(Boolean);
const CLUSTER_TOKENS = (process.env.SANITIZE_CLUSTER_TOKENS ?? '')
  .split(',')
  .map((token) => token.trim())
  .filter(Boolean);

const nodeNames = new Map();

/* Each payload is sanitized by its own process, so an alias cannot depend on
 * encounter order: a node missing from one list -- a Node without a
 * NodeNetworkState -- would take a different alias in each fixture, and the view
 * joins them by name. The shared token list, exported to every call, gives each
 * node one stable position. */
const placeholderNode = (value) => {
  if (!nodeNames.has(value)) {
    const position = NODE_TOKENS.indexOf(value);
    // A name outside the token list cannot occupy a listed position, so it is
    // numbered past the list rather than colliding with a real node.
    nodeNames.set(
      value,
      `node-${position === -1 ? NODE_TOKENS.length + nodeNames.size + 1 : position + 1}`,
    );
  }

  return nodeNames.get(value);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Match a token only where it stands alone: a node called `net` leaves
 * `ethernet` alone, and `worker-0` leaves `worker-01` alone. Letters and digits
 * are the continuations that matter; `-` and `.` separate names in this data. */
const tokenPattern = (token, flags = 'g') =>
  new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(token)}(?![A-Za-z0-9])`, flags);
const replaceToken = (input, token, replacement) =>
  input.replace(tokenPattern(token), () => replacement);
const containsToken = (text, token) => tokenPattern(token, '').test(text);

const scrubString = (value) => {
  let scrubbed = value;

  for (const token of [...NODE_TOKENS].sort((a, b) => b.length - a.length)) {
    if (containsToken(scrubbed, token)) {
      scrubbed = replaceToken(scrubbed, token, placeholderNode(token));
    }
  }

  for (const token of [...CLUSTER_TOKENS].sort((a, b) => b.length - a.length)) {
    if (containsToken(scrubbed, token)) {
      scrubbed = replaceToken(scrubbed, token, 'cluster.example.com');
    }
  }

  // One pass over every address kind: a structured value can carry several
  // addresses, and one of each kind, so a per-kind replacement left the rest for
  // the self-check to refuse. MAC comes first because the IPv6 token also matches
  // a MAC, and a single pass never re-examines the placeholders it writes.
  scrubbed = scrubbed.replace(ADDRESS, (_match, mac, ipv4) => {
    if (mac) return DOC_MAC;
    if (ipv4) return DOC_IPV4;
    return DOC_IPV6;
  });

  if (CLUSTER_SUFFIX.test(scrubbed)) return 'example.com';
  return scrubbed;
};

const fail = (message) => {
  process.stderr.write(`refusing to record: ${message}\n`);
  process.exit(1);
};

/* Fail closed. Without both token lists nothing is substituted and the node and
 * cluster names of whatever cluster is current would be committed verbatim, so
 * a discovery step that silently found nothing must stop the recording. */
if (NODE_TOKENS.length === 0 || CLUSTER_TOKENS.length === 0) {
  fail(
    'SANITIZE_NODE_TOKENS and SANITIZE_CLUSTER_TOKENS must both be non-empty; ' +
      'record with scripts/record-integration-fixtures.sh so the identities are discovered first',
  );
}

const scrub = (value, parentKey) => {
  // Arrays of strings (EndpointSlice addresses, externalIPs) never reached a
  // member check, so primitives are scrubbed here too.
  if (typeof value === 'string') return scrubString(value);

  if (Array.isArray(value)) return value.map((item) => scrub(item, parentKey));

  if (value && typeof value === 'object') {
    if (typeof value.kind === 'string' && FORBIDDEN_KINDS.has(value.kind)) {
      fail(`payload contains a ${value.kind} object`);
    }

    // Route TLS keys are inline PEM private keys; a Route is a normal recorded
    // kind, so the Secret deny-list above does not cover them.
    if (value.kind === 'Route' && typeof value.spec?.tls?.key === 'string') {
      fail('payload contains an inline Route TLS private key');
    }

    const metadata = value.metadata;
    if (metadata && typeof metadata === 'object') {
      for (const field of IDENTITY_FIELDS) delete metadata[field];

      if (metadata.annotations && typeof metadata.annotations === 'object') {
        for (const key of Object.keys(metadata.annotations)) {
          if (ANNOTATION_DENYLIST.has(key)) delete metadata.annotations[key];
        }
      }

      if (typeof metadata.namespace === 'string' && !ALLOWED_NAMESPACES.has(metadata.namespace)) {
        fail('payload references a namespace outside the suite allow-list');
      }

      // A NodeNetworkState is named after its node, so the name itself is a
      // hostname; policy names are user-chosen and stay as they are.
      if (value.kind === 'NodeNetworkState' && typeof metadata.name === 'string') {
        metadata.name = placeholderNode(metadata.name);
      }
    }

    for (const [key, child] of Object.entries(value)) {
      if (key === 'clusterIPs' && Array.isArray(child)) {
        value[key] = child.map((ip) => (ip === 'None' ? 'None' : DOC_IPV4));
        continue;
      }

      if (
        (key === 'clusterIP' || key === 'hostIP' || key === 'ip' || key === 'podIP') &&
        typeof child === 'string'
      ) {
        value[key] = child === 'None' ? 'None' : DOC_IPV4;
        continue;
      }

      if ((key === 'hostIPs' || key === 'podIPs') && Array.isArray(child)) {
        value[key] = child.map(() => ({ ip: DOC_IPV4 }));
        continue;
      }

      if (key === 'nodeName' && typeof child === 'string') {
        value[key] = placeholderNode(child);
        continue;
      }

      // Load balancer hostnames carry the cluster's DNS suffix.
      if (key === 'hostname' && typeof child === 'string') {
        value[key] = 'example.com';
        continue;
      }

      value[key] = typeof child === 'string' ? scrubString(child) : scrub(child, key);
    }

    return value;
  }

  return value;
};

/* NodeNetworkState bodies carry every interface, route and address on each node.
 * The fixtures only assert the OVN bridge mappings, so the payload is projected
 * to that subtree: smaller to review, and no interface inventory in the repo. */
const projectNodeNetworkState = (list) => ({
  ...list,
  items: (list.items ?? []).map((item) => ({
    apiVersion: item.apiVersion,
    kind: item.kind,
    metadata: { name: item.metadata?.name },
    status: { currentState: { ovn: item.status?.currentState?.ovn ?? {} } },
  })),
});

/* Nodes carry kubelet config, addresses and labels the tests never read. Keep
 * the name the observed-mapping rows display; the sanitizer has already
 * replaced it with a placeholder. */
const projectNodeList = (list) => ({
  ...list,
  items: (list.items ?? []).map((item) => ({
    apiVersion: item.apiVersion,
    kind: item.kind,
    metadata: { name: item.metadata?.name },
  })),
});

/* QuickStarts are large multi-step documents. The NAD empty state only reads
 * the display name and description when it looks for a matching tutorial. */
const projectQuickStartList = (list) => ({
  ...list,
  items: (list.items ?? []).map((item) => ({
    apiVersion: item.apiVersion,
    kind: item.kind,
    metadata: { name: item.metadata?.name },
    spec: {
      description: item.spec?.description,
      displayName: item.spec?.displayName,
    },
  })),
});

/* Pods carry runtime container IDs, image IDs, service-account volume suffixes
 * and host/pod addresses. The tables read identity, labels, the network
 * annotation, phase/readiness and node name; everything else is dropped. */
const projectPodList = (list) => ({
  ...list,
  items: (list.items ?? []).map((item) => {
    if (!ALLOWED_POD_NAMES.has(item.metadata?.name)) {
      fail('PodList contains a pod the suite does not own');
    }

    return {
      apiVersion: item.apiVersion,
      kind: item.kind,
      metadata: {
        annotations: item.metadata?.annotations?.['k8s.v1.cni.cncf.io/networks']
          ? {
              'k8s.v1.cni.cncf.io/networks':
                item.metadata.annotations['k8s.v1.cni.cncf.io/networks'],
            }
          : undefined,
        deletionTimestamp: item.metadata?.deletionTimestamp,
        labels: item.metadata?.labels,
        name: item.metadata?.name,
        namespace: item.metadata?.namespace,
      },
      spec: {
        containers: (item.spec?.containers ?? []).map(({ image, name, ports }) => ({
          image,
          name,
          ports,
        })),
        nodeName: item.spec?.nodeName,
      },
      status: {
        conditions: item.status?.conditions,
        containerStatuses: (item.status?.containerStatuses ?? []).map(
          ({ name, ready, restartCount, state }) => ({ name, ready, restartCount, state }),
        ),
        initContainerStatuses: (item.status?.initContainerStatuses ?? []).map(
          ({ name, ready, restartCount, state }) => ({ name, ready, restartCount, state }),
        ),
        phase: item.status?.phase,
        podIP: item.status?.podIP,
        reason: item.status?.reason,
      },
    };
  }),
});

/* The VM tables only resolve names and specs from instancetypes. */
const projectInstancetypeList = (list) => ({
  ...list,
  items: (list.items ?? []).map((item) => ({
    apiVersion: item.apiVersion,
    kind: item.kind,
    metadata: { name: item.metadata?.name, namespace: item.metadata?.namespace },
    spec: item.spec,
  })),
});

const PROJECTIONS = {
  ConsoleQuickStartList: projectQuickStartList,
  NodeList: projectNodeList,
  PodList: projectPodList,
  VirtualMachineClusterInstancetypeList: projectInstancetypeList,
  VirtualMachineInstancetypeList: projectInstancetypeList,
};

/* Cluster-scoped lists can contain objects another team owns, and their names are
 * the only handle a reader would get. Ownership is the label the suite's seeds
 * carry -- the same one ci-scripts/test-cleanup.sh sweeps by -- rather than a name
 * pattern, which cannot tell `test-cudn-team` from another team's
 * `test-cudn-other-team`. */
const CLUSTER_SCOPED_KINDS = new Set([
  'ClusterUserDefinedNetworkList',
  'NodeNetworkConfigurationPolicyList',
]);
const MANAGED_BY_LABEL = 'app.kubernetes.io/managed-by';
const MANAGED_BY_VALUE = 'networking-console-plugin-test';

/* An empty recording is almost always a missing seed or a mis-scoped request;
 * committing it would silently replace a fixture the suite asserts on. Only the
 * kinds that are legitimately empty in this suite are allowed through. */
const EMPTY_ALLOWED_KINDS = new Set([
  'MultiNetworkPolicyList',
  'NodeNetworkConfigurationEnactmentList',
  'NodeNetworkConfigurationPolicyList',
  'VirtualMachineInstanceList',
  'VirtualMachineInstancetypeList',
]);

const guardEmptyList = (payload) => {
  if (!Array.isArray(payload?.items) || payload.items.length > 0) return;
  if (EMPTY_ALLOWED_KINDS.has(payload.kind)) return;

  fail(`${payload.kind} is empty; refusing to replace a non-empty recording`);
};

const guardClusterScoped = (payload) => {
  if (!CLUSTER_SCOPED_KINDS.has(payload?.kind)) return;

  for (const item of payload.items ?? []) {
    if (item.metadata?.labels?.[MANAGED_BY_LABEL] !== MANAGED_BY_VALUE) {
      fail(`cluster-scoped ${payload.kind} contains an object the suite does not own`);
    }
  }
};

const raw = fs.readFileSync(0, 'utf8');
const scrubbed = scrub(JSON.parse(raw), '');
const payload =
  scrubbed?.kind === 'NodeNetworkStateList'
    ? projectNodeNetworkState(scrubbed)
    : (PROJECTIONS[scrubbed?.kind] ?? ((value) => value))(scrubbed);

guardEmptyList(payload);
guardClusterScoped(payload);
const serialized = `${JSON.stringify(payload, null, 2)}\n`;

// Self-check: the fixtures land in a public repository, so anything that still
// looks like a real address, cluster domain, or credential aborts the recording.
// Documentation ranges (RFC 5737 / RFC 3849) stand in for real addresses, so they
// are allowed; anything else is a leak.
const withoutPlaceholders = serialized
  .replace(/\b(?:192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}\b/g, '')
  .replace(/\b2001:db8(?::[a-f0-9]{0,4})*\b/gi, '')
  .split(DOC_MAC)
  .join('');

/* A node already named `node-1` is aliased to its own name, so the placeholder
 * itself is not a leak; only a token that survived under a different alias is. */
const leakedNode = NODE_TOKENS.some((token) => {
  const alias = nodeNames.get(token);

  return alias !== token && containsToken(serialized, token);
});
const leakedCluster = CLUSTER_TOKENS.some(
  (token) => token !== 'cluster.example.com' && containsToken(serialized, token),
);

const violations = [
  ['IPv4 address', IPV4.test(withoutPlaceholders)],
  ['IPv6 address', IPV6.test(withoutPlaceholders)],
  ['MAC address', MAC.test(withoutPlaceholders)],
  ['cluster domain', CLUSTER_SUFFIX.test(serialized)],
  ['authorization header', /authorization\s*:/i.test(serialized)],
  ['bearer token', /bearer\s+[a-z0-9._-]{10,}/i.test(serialized)],
  ['private key', PRIVATE_KEY.test(serialized)],
  ['last-applied annotation', serialized.includes('last-applied-configuration')],
  // The closing quote is part of the match, otherwise "cy-test-ns-other" passes
  // on the "cy-test-ns" prefix.
  ['foreign namespace', /"namespace":\s*"(?!(?:cy-test-ns|udn-test-ns)")[^"]+"/.test(serialized)],
  ['node name', leakedNode],
  ['cluster identifier', leakedCluster],
].filter(([, matched]) => matched);

if (violations.length > 0) {
  fail(`output still contains ${violations.map(([name]) => name).join(', ')}`);
}

process.stdout.write(serialized);
