import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1Interface, V1Network, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { k8sPatch } from '@openshift-console/dynamic-plugin-sdk';

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
