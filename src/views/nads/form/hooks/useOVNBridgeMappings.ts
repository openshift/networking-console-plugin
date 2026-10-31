import { useMemo } from 'react';

import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NodeNetworkStateModelGroupVersionKind } from '@utils/models';
import { getObservedBridgeMappings } from '@utils/resources/nmstate/selectors';
import { NodeNetworkStateKind } from '@utils/resources/nmstate/types';

const useOVNBridgeMappings = (): string[] => {
  const [nodeNetworkStates, loaded, loadError] = useK8sWatchResource<NodeNetworkStateKind[]>({
    groupVersionKind: NodeNetworkStateModelGroupVersionKind,
    isList: true,
    optional: true,
  });

  return useMemo(() => {
    if (!loaded || loadError || !Array.isArray(nodeNetworkStates)) {
      return [];
    }

    return [
      ...new Set(getObservedBridgeMappings(nodeNetworkStates).map(({ localnet }) => localnet)),
    ];
  }, [loadError, loaded, nodeNetworkStates]);
};

export default useOVNBridgeMappings;
