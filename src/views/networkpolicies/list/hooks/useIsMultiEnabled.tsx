import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { K8sResourceCommon, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NetworkConfigModel } from '@views/nads/form/utils/constants';

const useIsMultiEnabled = (): [enabled: boolean, loaded: boolean, error: any] => {
  const [networkClusterConfig, loaded, error] = useK8sWatchResource<
    { spec: any } & K8sResourceCommon
  >({
    groupVersionKind: modelToGroupVersionKind(NetworkConfigModel),
    name: 'cluster',
  });

  if (networkClusterConfig?.spec?.disableMultiNetwork) {
    return [!networkClusterConfig?.spec?.disableMultiNetwork, loaded, error];
  }

  if (networkClusterConfig?.spec?.useMultiNetworkPolicy) {
    return [networkClusterConfig?.spec?.useMultiNetworkPolicy, loaded, error];
  }

  return [false, loaded, error];
};

export default useIsMultiEnabled;
