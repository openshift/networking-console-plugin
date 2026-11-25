import { InterfaceType } from '@kubevirt-ui-ext/kubevirt-api/nmstate';

// Interface filtering constants
export const OVN_K8S_MP0 = 'ovn-k8s-mp0';
export const BR_INT = 'br-int';
export const GENEV_SYS_PREFIX = 'genev_sys_';

// Link aggregation and VLAN constants
export const LINK_AGGREGATION = 'link-aggregation';
export const BASE_IFACE = 'base-iface';

// Interface type to topology level mapping
// Lower numbers appear higher in the topology hierarchy
const networkTypeLevelMap = {
  [InterfaceType.BOND]: 4,
  [InterfaceType.ETHERNET]: 5,
  [InterfaceType.INFINIBAND]: 5,
  [InterfaceType.LINUX_BRIDGE]: 2,
  [InterfaceType.OVS_BRIDGE]: 2,
  [InterfaceType.OVS_INTERFACE]: 1,
  [InterfaceType.VLAN]: 3,
};

// Proxy to provide default level for unknown interface types
export const networkNodeLevel = new Proxy(networkTypeLevelMap, {
  get(target, prop: string) {
    return target[prop] ?? 1;
  },
});
