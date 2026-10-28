import { TFunction } from 'i18next';

import { NMStateInterface } from '@views/topology/types';

export interface InterfaceGroup {
  interfaces: NMStateInterface[];
  type: string;
}

export const groupInterfacesByType = (interfaces: NMStateInterface[]): InterfaceGroup[] => {
  const grouped = new Map<string, NMStateInterface[]>();

  interfaces.forEach((iface) => {
    const type = iface.type || 'unknown';
    const existing = grouped.get(type) ?? [];
    existing.push(iface);
    grouped.set(type, existing);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, ifaces]) => ({
      interfaces: ifaces.sort((a, b) => a.name.localeCompare(b.name)),
      type,
    }));
};

export const formatInterfaceLinks = (iface: NMStateInterface): string[] => {
  const links: string[] = [];

  if (iface.bridge?.port) {
    iface.bridge.port.forEach((port) => {
      links.push(`← ${port.name}`);
    });
  }

  return links;
};

export const formatIPAddresses = (iface: NMStateInterface): string => {
  const addresses: string[] = [];

  if (iface.ipv4?.enabled && iface.ipv4.address) {
    iface.ipv4.address.forEach((addr) => {
      addresses.push(`${addr.ip}/${addr['prefix-length']}`);
    });
  }

  if (iface.ipv6?.enabled && iface.ipv6.address) {
    iface.ipv6.address.forEach((addr) => {
      addresses.push(`${addr.ip}/${addr['prefix-length']}`);
    });
  }

  return addresses.length > 0 ? addresses.join(', ') : '';
};

export const interfaceTypeLabel = (t: TFunction, type: string): string => {
  switch (type) {
    case 'ethernet':
      return t('ethernet');
    case 'linux-bridge':
      return t('linux-bridge');
    case 'ovs-bridge':
      return t('ovs-bridge');
    case 'ovs-interface':
      return t('ovs-interface');
    case 'tunnel':
      return t('tunnel');
    case 'veth':
      return t('veth');
    case 'vlan':
      return t('vlan');
    default:
      return type;
  }
};

export const DEFAULT_PER_PAGE = 10;

export const paginate = <T>(items: T[], page: number, perPage = DEFAULT_PER_PAGE): T[] =>
  items.slice((page - 1) * perPage, page * perPage);
