import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NodeNetworkStateModelGroupVersionKind } from '@utils/models';
import { NodeNetworkStateKind } from '@views/topology/types';

type UseNodeNetworkStatesResult = {
  loaded: boolean;
  loadError: unknown;
  nodeNetworkStates: NodeNetworkStateKind[];
};

const useNodeNetworkStates = (): UseNodeNetworkStatesResult => {
  const [data, loaded, loadError] = useK8sWatchResource<NodeNetworkStateKind[]>({
    groupVersionKind: NodeNetworkStateModelGroupVersionKind,
    isList: true,
    namespaced: false,
  });

  return {
    loaded,
    loadError,
    nodeNetworkStates: data ?? [],
  };
};

export default useNodeNetworkStates;
