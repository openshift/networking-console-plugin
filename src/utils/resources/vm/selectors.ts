import {
  V1DomainSpec,
  V1Interface,
  V1Network,
  V1VirtualMachine,
  V1VirtualMachineCondition,
} from '@kubevirt-ui/kubevirt-api/kubevirt';

import {
  getVMCPUCountWithLookups,
  getVMMemoryWithLookups,
  VMResourceLookups,
} from './vmResourceLookups';

export type { VMResourceLookups } from './vmResourceLookups';

const VM_DELETE_PROTECTION_LABEL = 'kubevirt.io/vm-delete-protection';

export const getNetworks = (vm: V1VirtualMachine): V1Network[] =>
  vm?.spec?.template?.spec?.networks || [];

export const getInterfaces = (vm: V1VirtualMachine): V1Interface[] =>
  vm?.spec?.template?.spec?.domain?.devices?.interfaces || [];

export const getVMStatus = (vm: V1VirtualMachine): string => vm?.status?.printableStatus || '';

export const getVMDomain = (vm: V1VirtualMachine): undefined | V1DomainSpec =>
  vm?.spec?.template?.spec?.domain;

export const getVMMemory = (vm: V1VirtualMachine, lookups?: VMResourceLookups): string =>
  getVMMemoryWithLookups(vm, lookups);

export const getVMCPUCount = (vm: V1VirtualMachine, lookups?: VMResourceLookups): number =>
  getVMCPUCountWithLookups(vm, lookups);

export const getVMConditions = (vm: V1VirtualMachine): V1VirtualMachineCondition[] =>
  vm?.status?.conditions || [];

export const getVMConditionsSummary = (vm: V1VirtualMachine): string => {
  const conditions = getVMConditions(vm)
    .filter((condition) => condition.status === 'True')
    .map((condition) => condition.type);

  return conditions.join(', ');
};

export const getVMDeletionProtection = (vm: V1VirtualMachine): boolean =>
  vm?.metadata?.labels?.[VM_DELETE_PROTECTION_LABEL]?.toLowerCase() === 'true';
