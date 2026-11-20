import { useFlag, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { FLAG_NMSTATE_CRDS } from '@utils/flags/consts';
import { NodeNetworkStateModelGroupVersionKind } from '@utils/models';
import { NodeNetworkStateKind } from '@views/topology/types';

type UseNodeNetworkStatesResult = {
  loaded: boolean;
  loadError: unknown;
  nmstateAvailable: boolean;
  nodeNetworkStates: NodeNetworkStateKind[];
};

const useNodeNetworkStates = (): UseNodeNetworkStatesResult => {
  const nmstateAvailable = useFlag(FLAG_NMSTATE_CRDS);
  const [data, loaded, loadError] = useK8sWatchResource<NodeNetworkStateKind[]>(
    nmstateAvailable
      ? {
          groupVersionKind: NodeNetworkStateModelGroupVersionKind,
          isList: true,
          namespaced: false,
          optional: true,
        }
      : null,
  );

  return {
    loaded: !nmstateAvailable || loaded,
    loadError,
    nmstateAvailable,
    nodeNetworkStates: data ?? [],
  };
};

export default useNodeNetworkStates;
