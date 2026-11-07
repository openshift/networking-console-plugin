import { TFunction } from 'i18next';

import { NMStateInterface } from '@views/topology/types';

import {
  DEFAULT_PER_PAGE,
  formatInterfaceLinks,
  formatIPAddresses,
  groupInterfacesByType,
  interfaceTypeLabel,
  paginate,
} from './index';

describe('TopologyTableView utils', () => {
  it('groups interfaces by type and sorts groups and members', () => {
    const interfaces: NMStateInterface[] = [
      { name: 'eth1', type: 'ethernet' },
      { name: 'br0', type: 'linux-bridge' },
      { name: 'eth0', type: 'ethernet' },
      { name: 'lo' },
    ];

    expect(groupInterfacesByType(interfaces)).toEqual([
      {
        interfaces: [
          { name: 'eth0', type: 'ethernet' },
          { name: 'eth1', type: 'ethernet' },
        ],
        type: 'ethernet',
      },
      { interfaces: [{ name: 'br0', type: 'linux-bridge' }], type: 'linux-bridge' },
      { interfaces: [{ name: 'lo' }], type: 'unknown' },
    ]);
  });

  it('formats IPv4 and IPv6 addresses', () => {
    expect(formatIPAddresses({ name: 'eth0' })).toBe('');
    expect(
      formatIPAddresses({
        ipv4: { address: [{ ip: '10.0.0.2', 'prefix-length': 24 }], enabled: true },
        name: 'eth0',
      }),
    ).toBe('10.0.0.2/24');
    expect(
      formatIPAddresses({
        ipv4: { address: [{ ip: '10.0.0.2', 'prefix-length': 24 }], enabled: false },
        name: 'eth0',
      }),
    ).toBe('');
    expect(
      formatIPAddresses({
        ipv4: { address: [{ ip: '10.0.0.2', 'prefix-length': 24 }], enabled: true },
        ipv6: { address: [{ ip: '2001:db8::2', 'prefix-length': 64 }], enabled: true },
        name: 'eth0',
      }),
    ).toBe('10.0.0.2/24, 2001:db8::2/64');
  });

  it('formats bridge ports as arrowed links', () => {
    expect(
      formatInterfaceLinks({ bridge: { port: [{ name: 'eth0' }, { name: 'eth1' }] }, name: 'br0' }),
    ).toEqual(['← eth0', '← eth1']);
    expect(formatInterfaceLinks({ name: 'eth0' })).toEqual([]);
  });

  it('translates known interface types and passes unknown values through', () => {
    const t = ((key: string) => `translated:${key}`) as unknown as TFunction;

    expect(interfaceTypeLabel(t, 'ethernet')).toBe('translated:ethernet');
    expect(interfaceTypeLabel(t, 'vlan')).toBe('translated:vlan');
    expect(interfaceTypeLabel(t, 'custom-type')).toBe('custom-type');
  });

  it('paginates with the default page size', () => {
    const items = Array.from({ length: 25 }, (_, index) => index);

    expect(DEFAULT_PER_PAGE).toBe(10);
    expect(paginate(items, 1)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(paginate(items, 3)).toEqual([20, 21, 22, 23, 24]);
    expect(paginate(items, 4)).toEqual([]);
  });
});
