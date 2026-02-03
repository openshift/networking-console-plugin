import { V1Interface, V1Network, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';

export const getNetworks = (vm: V1VirtualMachine): V1Network[] =>
  vm?.spec?.template?.spec?.networks || [];

export const getInterfaces = (vm: V1VirtualMachine): V1Interface[] =>
  vm?.spec?.template?.spec?.domain?.devices?.interfaces || [];

export const getVMStatus = (vm: V1VirtualMachine): string => vm?.status?.printableStatus || '';
