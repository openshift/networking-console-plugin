import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1Interface, V1Network, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { k8sPatch } from '@openshift-console/dynamic-plugin-sdk';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getName, getNamespace } from '@utils/resources/shared';

import { INTERFACE_PATH, NETWORK_PATH } from './constants';
import { getInterfaces, getNetworks, getVMStatus } from './selectors';
import { PatchItem } from './types';

// This file contains utils from kubevirt-plugin

const markOneInterfaceAbsent = (iface: V1Interface) => ({ ...iface, state: 'absent' });

const updateInterface = ({
  currentValue,
  index,
  nextValue,
}: {
  currentValue: V1Interface;
  index: number;
  nextValue: V1Interface;
}): PatchItem<V1Interface>[] => {
  const replaceValue: V1Interface = { ...currentValue, ...nextValue };

  if (!nextValue.bridge) delete replaceValue.bridge;
  if (!nextValue.masquerade) delete replaceValue.masquerade;
  if (!nextValue.sriov) delete replaceValue.sriov;

  return [
    {
      op: 'test',
      path: `${INTERFACE_PATH}/${index}`,
      value: currentValue,
    },
    {
      op: 'replace',
      path: `${INTERFACE_PATH}/${index}`,
      value: replaceValue,
    },
  ];
};

const removeNetwork = ({
  index,
  value,
}: {
  index: number;
  value: V1Network;
}): PatchItem<V1Network>[] => removeAtIndex({ index, path: NETWORK_PATH, value });

const removeInterface = ({
  index,
  value,
}: {
  index: number;
  value: V1Interface;
}): PatchItem<V1Interface>[] => removeAtIndex({ index, path: INTERFACE_PATH, value });

const removeAtIndex = <T>({
  index,
  path,
  value,
}: {
  index: number;
  path: string;
  value: T;
}): PatchItem<T>[] => [
  {
    op: 'test',
    path: `${path}/${index}`,
    value,
  },
  {
    op: 'remove',
    path: `${path}/${index}`,
    value: undefined,
  },
];

const replaceAtIndex = <T>({
  index,
  path,
  value,
}: {
  index: number;
  path: string;
  value: T;
}): PatchItem<T>[] => [
  {
    op: 'replace',
    path: `${path}/${index}`,
    value,
  },
];

const patchVM = (vm: V1VirtualMachine, items: PatchItem<unknown>[]) =>
  k8sPatch({
    data: items,
    model: VirtualMachineModel,
    resource: vm,
  });

export const multusNetworkMatchesNAD = (
  network: V1Network,
  nad: NetworkAttachmentDefinitionKind,
  vm: V1VirtualMachine,
): boolean => {
  const nadName = getName(nad);
  const nadNamespace = getNamespace(nad);
  const multusNetworkName = network.multus?.networkName;

  if (!nadName || !nadNamespace || !multusNetworkName) {
    return false;
  }

  const qualifiedName = `${nadNamespace}/${nadName}`;

  if (multusNetworkName === qualifiedName) {
    return true;
  }

  return multusNetworkName === nadName && getNamespace(vm) === nadNamespace;
};

type NADNetworkPair = {
  iface: V1Interface;
  ifaceIndex: number;
  network: V1Network;
  networkIndex: number;
};

const getNADNetworkPairs = (
  vm: V1VirtualMachine,
  nad: NetworkAttachmentDefinitionKind,
): NADNetworkPair[] =>
  getNetworks(vm).flatMap((network, networkIndex) => {
    if (!multusNetworkMatchesNAD(network, nad, vm)) {
      return [];
    }

    const ifaceIndex = getInterfaces(vm).findIndex((item) => item.name === network.name);
    const iface = ifaceIndex >= 0 ? getInterfaces(vm)[ifaceIndex] : undefined;

    if (!iface) {
      return [];
    }

    return [{ iface, ifaceIndex, network, networkIndex }];
  });

const buildRemovePairPatches = (pairs: NADNetworkPair[]): PatchItem<unknown>[] => {
  const ifaceIndices = [...new Set(pairs.map((pair) => pair.ifaceIndex))].sort((a, b) => b - a);
  const networkIndices = [...new Set(pairs.map((pair) => pair.networkIndex))].sort((a, b) => b - a);

  return [
    ...ifaceIndices.map((index) => ({
      op: 'remove',
      path: `${INTERFACE_PATH}/${index}`,
      value: undefined,
    })),
    ...networkIndices.map((index) => ({
      op: 'remove',
      path: `${NETWORK_PATH}/${index}`,
      value: undefined,
    })),
  ];
};

const createVMWithoutNetworkNames = (
  vm: V1VirtualMachine,
  namesToRemove: Set<string>,
): V1VirtualMachine => ({
  ...vm,
  spec: {
    ...vm.spec,
    template: {
      ...vm.spec?.template,
      spec: {
        ...vm.spec?.template?.spec,
        domain: {
          ...vm.spec?.template?.spec?.domain,
          devices: {
            ...vm.spec?.template?.spec?.domain?.devices,
            interfaces: getInterfaces(vm).filter((iface) => !namesToRemove.has(iface.name)),
          },
        },
        networks: getNetworks(vm).filter((network) => !namesToRemove.has(network.name)),
      },
    },
  },
});

const getOrphanedNADNetworkPatches = (
  vm: V1VirtualMachine,
  nad: NetworkAttachmentDefinitionKind,
): PatchItem<unknown>[] => {
  const orphanedNetworks = getNetworks(vm)
    .map((network, networkIndex) => ({ network, networkIndex }))
    .filter(
      ({ network }) =>
        multusNetworkMatchesNAD(network, nad, vm) &&
        !getInterfaces(vm).some((iface) => iface.name === network.name),
    )
    .sort((a, b) => b.networkIndex - a.networkIndex);

  return orphanedNetworks.map(({ networkIndex }) => ({
    op: 'remove',
    path: `${NETWORK_PATH}/${networkIndex}`,
    value: undefined,
  }));
};

export const deleteNetworkInterface = (
  vm: V1VirtualMachine,
  iface: V1Interface,
  network: V1Network,
) => {
  const isHotUnPlug = Boolean(iface.bridge);
  const canBeMarkedAbsent = isHotUnPlug && getVMStatus(vm) !== 'Stopped';

  if (canBeMarkedAbsent) {
    return patchVM(
      vm,
      updateInterface({
        currentValue: iface,
        index: getInterfaces(vm).findIndex((i) => i.name === iface.name),
        nextValue: markOneInterfaceAbsent(iface),
      }),
    );
  }

  return patchVM(vm, [
    ...removeNetwork({
      index: getNetworks(vm).findIndex((n) => n.name === network.name),
      value: network,
    }),
    ...removeInterface({
      index: getInterfaces(vm).findIndex((i) => i.name === iface.name),
      value: iface,
    }),
  ]);
};

export const replaceNetwork = (vm: V1VirtualMachine, newNetwork: V1Network) => {
  return patchVM(
    vm,
    replaceAtIndex({
      index: getNetworks(vm).findIndex((n) => n.name === newNetwork.name),
      path: NETWORK_PATH,
      value: newNetwork,
    }),
  );
};

export const getMultusNetworkNameForNAD = (
  nad: NetworkAttachmentDefinitionKind,
  vmNamespace: string,
): string => {
  const nadName = getName(nad);
  const nadNamespace = getNamespace(nad);

  if (!nadName || !nadNamespace) {
    return '';
  }

  if (vmNamespace === nadNamespace) {
    return nadName;
  }

  return `${nadNamespace}/${nadName}`;
};

const generateNetworkInterfaceName = (vm: V1VirtualMachine): string => {
  const baseName = `nic-${getName(vm)}`;
  const existingNames = new Set([
    ...getNetworks(vm).map((network) => network.name),
    ...getInterfaces(vm).map((iface) => iface.name),
  ]);

  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let suffix = 1;
  let candidate = `${baseName}-${suffix}`;

  while (existingNames.has(candidate)) {
    suffix += 1;
    candidate = `${baseName}-${suffix}`;
  }

  return candidate;
};

export const createMultusNetworkInterface = (
  vm: V1VirtualMachine,
  nad: NetworkAttachmentDefinitionKind,
): { iface: V1Interface; network: V1Network } => {
  const name = generateNetworkInterfaceName(vm);
  const vmNamespace = getNamespace(vm);

  return {
    iface: { bridge: {}, name },
    network: {
      multus: { networkName: getMultusNetworkNameForNAD(nad, vmNamespace) },
      name,
    },
  };
};

const addAtEnd = <T>({ path, value }: { path: string; value: T }): PatchItem<T>[] => [
  {
    op: 'add',
    path: `${path}/-`,
    value,
  },
];

export const removeVMFromNAD = (vm: V1VirtualMachine, networkName: string) => {
  const network = getNetworks(vm).find((item) => item.name === networkName);
  const iface = getInterfaces(vm).find((item) => item.name === networkName);

  if (!network || !iface) {
    return Promise.reject(new Error('Network interface not found'));
  }

  const networkIndex = getNetworks(vm).findIndex((item) => item.name === network.name);
  const ifaceIndex = getInterfaces(vm).findIndex((item) => item.name === iface.name);

  if (networkIndex < 0 || ifaceIndex < 0) {
    return Promise.reject(new Error('Network interface not found'));
  }

  const isHotUnPlug = Boolean(iface.bridge);
  const canBeMarkedAbsent = isHotUnPlug && getVMStatus(vm) !== 'Stopped';

  if (canBeMarkedAbsent) {
    return patchVM(
      vm,
      replaceAtIndex({
        index: ifaceIndex,
        path: INTERFACE_PATH,
        value: markOneInterfaceAbsent(iface),
      }),
    );
  }

  const patches: PatchItem<unknown>[] =
    networkIndex >= ifaceIndex
      ? [
          { op: 'remove', path: `${NETWORK_PATH}/${networkIndex}`, value: undefined },
          { op: 'remove', path: `${INTERFACE_PATH}/${ifaceIndex}`, value: undefined },
        ]
      : [
          { op: 'remove', path: `${INTERFACE_PATH}/${ifaceIndex}`, value: undefined },
          { op: 'remove', path: `${NETWORK_PATH}/${networkIndex}`, value: undefined },
        ];

  return patchVM(vm, patches);
};

export const addVMToNAD = (vm: V1VirtualMachine, nad: NetworkAttachmentDefinitionKind) => {
  const pairs = getNADNetworkPairs(vm, nad);
  const activePairs = pairs.filter(({ iface }) => iface.state !== 'absent');
  const disconnectedPairs = pairs.filter(({ iface }) => iface.state === 'absent');

  if (activePairs.length > 0) {
    return Promise.reject(new Error('Virtual machine is already connected to this network'));
  }

  if (disconnectedPairs.length === 1) {
    const [pairToReconnect] = disconnectedPairs;
    const vmNamespace = getNamespace(vm);

    return patchVM(vm, [
      ...replaceAtIndex({
        index: pairToReconnect.networkIndex,
        path: NETWORK_PATH,
        value: {
          multus: { networkName: getMultusNetworkNameForNAD(nad, vmNamespace) },
          name: pairToReconnect.network.name,
        },
      }),
      ...replaceAtIndex({
        index: pairToReconnect.ifaceIndex,
        path: INTERFACE_PATH,
        value: {
          bridge: {},
          name: pairToReconnect.iface.name,
        },
      }),
    ]);
  }

  if (disconnectedPairs.length > 1) {
    const namesToRemove = new Set(
      disconnectedPairs.flatMap(({ iface, network }) => [iface.name, network.name]),
    );
    const { iface, network } = createMultusNetworkInterface(
      createVMWithoutNetworkNames(vm, namesToRemove),
      nad,
    );

    return patchVM(vm, [
      ...buildRemovePairPatches(disconnectedPairs),
      ...addAtEnd({ path: NETWORK_PATH, value: network }),
      ...addAtEnd({ path: INTERFACE_PATH, value: iface }),
    ]);
  }

  const { iface, network } = createMultusNetworkInterface(vm, nad);

  return patchVM(vm, [
    ...getOrphanedNADNetworkPatches(vm, nad),
    ...addAtEnd({ path: NETWORK_PATH, value: network }),
    ...addAtEnd({ path: INTERFACE_PATH, value: iface }),
  ]);
};

export const addNetworkInterface = (vm: V1VirtualMachine, network: V1Network, iface: V1Interface) =>
  patchVM(vm, [
    ...addAtEnd({ path: NETWORK_PATH, value: network }),
    ...addAtEnd({ path: INTERFACE_PATH, value: iface }),
  ]);
