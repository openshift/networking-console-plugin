import {
  V1beta1VirtualMachineClusterInstancetype,
  V1beta1VirtualMachineInstancetype,
  V1beta1VirtualMachineInstancetypeSpec,
  V1DomainSpec,
  V1VirtualMachine,
  V1VirtualMachineInstance,
} from '@kubevirt-ui/kubevirt-api/kubevirt';

import { getName, getNamespace } from '../shared';

export type VMResourceLookups = {
  getInstancetypeSpec: (vm: V1VirtualMachine) => undefined | V1beta1VirtualMachineInstancetypeSpec;
  getVMI: (vm: V1VirtualMachine) => undefined | V1VirtualMachineInstance;
};

export const getVMResourceKey = (namespace?: string, name?: string): string =>
  namespace && name ? `${namespace}/${name}` : '';

const getCPUCountFromDomain = (domain?: V1DomainSpec): number => {
  if (!domain) {
    return 0;
  }

  const cpu = domain.cpu;

  if (cpu) {
    return (cpu.cores ?? 1) * (cpu.sockets ?? 1) * (cpu.threads ?? 1);
  }

  const requestCpu = domain.resources?.requests?.cpu;

  if (!requestCpu) {
    return 0;
  }

  if (requestCpu.endsWith('m')) {
    const millicores = Number.parseFloat(requestCpu.replace(/m$/, ''));

    return Number.isNaN(millicores) ? 0 : millicores / 1000;
  }

  const cores = Number.parseFloat(requestCpu);

  return Number.isNaN(cores) ? 0 : cores;
};

const getMemoryFromDomain = (domain?: V1DomainSpec): string =>
  domain?.memory?.guest ||
  domain?.resources?.requests?.memory ||
  domain?.resources?.limits?.memory ||
  '';

export const resolveVMInstancetypeSpec = (
  vm: V1VirtualMachine,
  clusterInstancetypes: Record<string, V1beta1VirtualMachineClusterInstancetype>,
  namespacedInstancetypes: Record<string, V1beta1VirtualMachineInstancetype>,
): undefined | V1beta1VirtualMachineInstancetypeSpec => {
  const matcher = vm?.spec?.instancetype;

  if (!matcher?.name) {
    return undefined;
  }

  const kind = matcher.kind ?? 'VirtualMachineClusterInstancetype';

  if (kind === 'VirtualMachineInstancetype') {
    return namespacedInstancetypes[getVMResourceKey(getNamespace(vm), matcher.name)]?.spec;
  }

  return clusterInstancetypes[matcher.name]?.spec;
};

export const getVMMemoryWithLookups = (
  vm: V1VirtualMachine,
  lookups?: VMResourceLookups,
): string => {
  const vmDomain = vm?.spec?.template?.spec?.domain;
  const memoryFromVm = getMemoryFromDomain(vmDomain);

  if (memoryFromVm) {
    return memoryFromVm;
  }

  const vmi = lookups?.getVMI(vm);
  const memoryFromVmi = getMemoryFromDomain(vmi?.spec?.domain);

  if (memoryFromVmi) {
    return memoryFromVmi;
  }

  const instancetypeSpec = lookups?.getInstancetypeSpec(vm);

  return instancetypeSpec?.memory?.guest || '';
};

export const getVMCPUCountWithLookups = (
  vm: V1VirtualMachine,
  lookups?: VMResourceLookups,
): number => {
  const vmDomain = vm?.spec?.template?.spec?.domain;
  const cpuFromVm = getCPUCountFromDomain(vmDomain);

  if (cpuFromVm) {
    return cpuFromVm;
  }

  const vmi = lookups?.getVMI(vm);
  const cpuFromVmi = getCPUCountFromDomain(vmi?.spec?.domain);

  if (cpuFromVmi) {
    return cpuFromVmi;
  }

  const instancetypeSpec = lookups?.getInstancetypeSpec(vm);

  return instancetypeSpec?.cpu?.guest ?? 0;
};

export const buildVMResourceLookups = (
  vmis: undefined | V1VirtualMachineInstance[],
  clusterInstancetypes: undefined | V1beta1VirtualMachineClusterInstancetype[],
  namespacedInstancetypes: undefined | V1beta1VirtualMachineInstancetype[],
): VMResourceLookups => {
  const vmiMap = (vmis ?? []).reduce<Record<string, V1VirtualMachineInstance>>((acc, vmi) => {
    const key = getVMResourceKey(getNamespace(vmi), getName(vmi));

    if (key) {
      acc[key] = vmi;
    }

    return acc;
  }, {});

  const clusterInstancetypeMap = (clusterInstancetypes ?? []).reduce<
    Record<string, V1beta1VirtualMachineClusterInstancetype>
  >((acc, instancetype) => {
    const name = getName(instancetype);

    if (name) {
      acc[name] = instancetype;
    }

    return acc;
  }, {});

  const namespacedInstancetypeMap = (namespacedInstancetypes ?? []).reduce<
    Record<string, V1beta1VirtualMachineInstancetype>
  >((acc, instancetype) => {
    const key = getVMResourceKey(getNamespace(instancetype), getName(instancetype));

    if (key) {
      acc[key] = instancetype;
    }

    return acc;
  }, {});

  return {
    getInstancetypeSpec: (vm) =>
      resolveVMInstancetypeSpec(vm, clusterInstancetypeMap, namespacedInstancetypeMap),
    getVMI: (vm) => vmiMap[getVMResourceKey(getNamespace(vm), getName(vm))],
  };
};
