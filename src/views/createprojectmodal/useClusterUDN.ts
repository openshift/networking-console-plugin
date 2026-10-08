import { K8sResourceCommon, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { useIsAdmin } from '@utils/hooks/useIsAdmin';
import { getGroupVersionKindForModel } from '@utils/models';
import { ClusterUserDefinedNetworkModel } from '@utils/models';

const useClusterUDN = () => {
  const isAdmin = useIsAdmin();

  return useK8sWatchResource<K8sResourceCommon[]>(
    isAdmin
      ? {
          groupVersionKind: getGroupVersionKindForModel(ClusterUserDefinedNetworkModel),
          isList: true,
        }
      : null,
  );
};

export default useClusterUDN;
