import { DECIMAL_NUMBER_PATTERN, IPV6_CHARACTER_PATTERN } from './constants';
import { BGPCondition } from './types';

export const condition = (conditions: BGPCondition[] = [], type = 'Available') =>
  conditions.find((item) => item.type === type);

const isValidIPv4 = (address: string) => {
  const octets = address.split('.');
  return (
    octets.length === 4 &&
    octets.every(
      (octet) =>
        DECIMAL_NUMBER_PATTERN.test(octet) &&
        (octet === '0' || !octet.startsWith('0')) &&
        Number(octet) <= 255,
    )
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

  if (!IPV6_CHARACTER_PATTERN.test(normalized)) return false;
  if (normalized.includes(':::')) return false;

  const doubleColonCount = (normalized.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;

  if (
    (normalized.startsWith(':') && !normalized.startsWith('::')) ||
    (normalized.endsWith(':') && !normalized.endsWith('::'))
  )
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
  if (!address || !DECIMAL_NUMBER_PATTERN.test(prefix)) return false;

  const prefixNumber = Number(prefix);
  return (
    (isValidIPv4(address) && prefixNumber <= 32) || (isValidIPv6(address) && prefixNumber <= 128)
  );
};
