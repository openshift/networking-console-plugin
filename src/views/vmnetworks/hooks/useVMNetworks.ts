import { useMemo } from 'react';

import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { ClusterUserDefinedNetworkModelGroupVersionKind } from '@utils/models';
import { LOCALNET_TOPOLOGY } from '@utils/resources/udns/constants';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

const useVMNetworks = (): [ClusterUserDefinedNetworkKind[], boolean, Error] => {
  const [resources, loaded, error] = useK8sWatchResource<ClusterUserDefinedNetworkKind[]>({
    groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
    isList: true,
    namespaced: false,
  });

  const vmNetworks = useMemo(
    () => resources?.filter((resource) => resource.spec.network.topology === LOCALNET_TOPOLOGY),
    [resources],
  );

  return [vmNetworks, loaded, error];
};

export default useVMNetworks;
