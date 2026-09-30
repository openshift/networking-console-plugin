import { useMemo } from 'react';

import { K8sResourceKind, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NodeNetworkStateModelGroupVersionKind } from '@utils/models';

type NodeNetworkStateKind = {
  status?: {
    currentState?: {
      ovn?: {
        'bridge-mappings'?: { localnet?: string; state?: string }[];
      };
    };
  };
} & K8sResourceKind;

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

    const names = new Set<string>();
    nodeNetworkStates.forEach((state) => {
      state?.status?.currentState?.ovn?.['bridge-mappings']?.forEach((mapping) => {
        if (mapping?.localnet && mapping.state !== 'absent') {
          names.add(mapping.localnet);
        }
      });
    });

    return [...names];
  }, [loadError, loaded, nodeNetworkStates]);
};

export default useOVNBridgeMappings;
