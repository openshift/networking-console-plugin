import { NadData } from '../types/nad';

export const bridge = 'br0';

export const NAD_BRIDGE: NadData = {
  bridge: bridge,
  description: 'bridge nad',
  macSpoof: true,
  name: 'network-bridge',
  type: 'Bridge',
  vlan: '100',
};

export const NAD_OVN: NadData = {
  description: 'ovn nad',
  name: 'network-ovn',
  type: 'OVN',
  vlan: '200',
};

export const NAD_LOCALNET: NadData = {
  bridge: bridge,
  description: 'localnet nad',
  mtu: '1500',
  name: 'network-localnet',
  type: 'Localnet',
  vlan: '300',
};
