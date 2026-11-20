import { describe, expect, it } from '@jest/globals';

import { NADRole, UDN_LABEL } from './constants';
import { filterUDNNads, isUserDefinedNetworkNAD, parseGlobalNamespaces } from './helpers';
import { NetworkAttachmentDefinitionKind } from './types';

const nad = (
  name: string,
  options: { labels?: Record<string, string>; role?: string; type?: string } = {},
): NetworkAttachmentDefinitionKind => {
  const config: Record<string, unknown> = {
    cniVersion: '0.3.1',
    name,
    type: options.type ?? 'bridge',
  };
  if (Object.prototype.hasOwnProperty.call(options, 'role')) {
    config.role = options.role;
  }

  return {
    metadata: {
      labels: options.labels,
      name,
      namespace: 'net-int-project',
    },
    spec: {
      config: JSON.stringify(config),
    },
  };
};

describe('isUserDefinedNetworkNAD', () => {
  it('is true when the UDN label key is present', () => {
    expect(isUserDefinedNetworkNAD(nad('udn', { labels: { [UDN_LABEL]: '' } }))).toBe(true);
  });

  it('is false for a regular NAD without the UDN label', () => {
    expect(isUserDefinedNetworkNAD(nad('bridge'))).toBe(false);
  });

  it('is false when metadata is missing', () => {
    expect(isUserDefinedNetworkNAD({} as NetworkAttachmentDefinitionKind)).toBe(false);
  });
});

describe('filterUDNNads', () => {
  const regular = nad('local-bridge');
  const secondaryUdn = nad('secondary', {
    labels: { [UDN_LABEL]: '' },
    role: NADRole.Secondary,
  });
  const primaryUdn = nad('primary', {
    labels: { [UDN_LABEL]: '' },
    role: NADRole.Primary,
  });
  const unlabeledPrimary = nad('legacy-primary', { role: NADRole.Primary });

  it('keeps regular and secondary NADs in regular, primary UDNs in primary', () => {
    const result = filterUDNNads([regular, secondaryUdn, primaryUdn, unlabeledPrimary]);

    expect(result.regular.map((item) => item.metadata?.name)).toEqual([
      'local-bridge',
      'secondary',
    ]);
    expect(result.primary.map((item) => item.metadata?.name)).toEqual([
      'primary',
      'legacy-primary',
    ]);
  });

  it('returns empty lists for an empty input', () => {
    expect(filterUDNNads([])).toEqual({ primary: [], regular: [] });
  });

  it('treats OVN-Kubernetes UDN NADs with omitted role as secondary (regular)', () => {
    // OVN-K defaults an omitted role to secondary; filterUDNNads mirrors that via !getNADRole.
    const omittedRole = nad('ovn-omitted', {
      type: 'ovn-k8s-cni-overlay',
    });

    const result = filterUDNNads([omittedRole, primaryUdn]);

    expect(result.regular.map((item) => item.metadata?.name)).toEqual(['ovn-omitted']);
    expect(result.primary.map((item) => item.metadata?.name)).toEqual(['primary']);
  });
});

describe('parseGlobalNamespaces', () => {
  it('returns an empty list for an empty config', () => {
    expect(parseGlobalNamespaces('')).toEqual([]);
  });

  it('returns an empty list for invalid JSON', () => {
    expect(parseGlobalNamespaces('{not-json')).toEqual([]);
  });

  it('returns an empty list when globalNamespaces is missing or not a string', () => {
    expect(parseGlobalNamespaces('{}')).toEqual([]);
    expect(parseGlobalNamespaces(JSON.stringify({ globalNamespaces: ['default'] }))).toEqual([]);
  });

  it('splits, trims, and drops empty segments', () => {
    expect(
      parseGlobalNamespaces(
        JSON.stringify({ globalNamespaces: ' default, openshift-multus, ,x ' }),
      ),
    ).toEqual(['default', 'openshift-multus', 'x']);
  });
});
