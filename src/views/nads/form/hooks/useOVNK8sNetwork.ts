import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { K8sResourceKind, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

import { CLUSTER_NETWORK_CONFIG_NAME, NetworkConfigModel, OVN_K8S } from '../utils/constants';

const useOVNK8sNetwork = (): [boolean, boolean] => {
  const [networkConfig, loaded] = useK8sWatchResource<K8sResourceKind>({
    groupVersionKind: modelToGroupVersionKind(NetworkConfigModel),
    isList: false,
    name: CLUSTER_NETWORK_CONFIG_NAME,
    namespaced: false,
  });

  const hasOVNK8sNetwork = networkConfig?.spec?.defaultNetwork?.type === OVN_K8S;

  return [hasOVNK8sNetwork, loaded];
};

export default useOVNK8sNetwork;
