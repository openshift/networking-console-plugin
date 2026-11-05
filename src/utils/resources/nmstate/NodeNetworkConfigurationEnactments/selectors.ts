import { NodeNetworkConfigurationInterface, V1beta1NodeNetworkState, } from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { findInterfaceByName, getNNSInterfaces, } from '@utils/resources/nmstate/NodeNetworkStates/selectors';
import { isEmpty } from '@utils/utils/helpers';

import { NodeNetworkConfigurationEnactmentKind } from './types';

/**
 * Find the enactment correlated to a NodeNetworkState
 */
export const getCorrelatedEnactment = (
  availableEnactments: NodeNetworkConfigurationEnactmentKind[],
  nnsName: string,
): NodeNetworkConfigurationEnactmentKind => {
  return availableEnactments?.find((nnce) =>
    nnce.metadata?.ownerReferences?.some((ref) => ref.name === nnsName),
  );
};

/**
 * Get interfaces configured by an enactment that exist in the node state
 */
export const getNNCEConfiguredInterfaces = (
  enactment: NodeNetworkConfigurationEnactmentKind,
  state: V1beta1NodeNetworkState,
): NodeNetworkConfigurationInterface[] => {
  if (isEmpty(enactment)) {
    return [];
  }

  const configured: NodeNetworkConfigurationInterface[] = [];

  const desiredInterfaces = enactment?.status?.desiredState?.interfaces || [];
  const currentInterfaces = getNNSInterfaces(state);

  desiredInterfaces.forEach((desiredIface) => {
    if (findInterfaceByName(currentInterfaces, desiredIface.name)) {
      configured.push(desiredIface);
    }
  });

  return configured;
};
