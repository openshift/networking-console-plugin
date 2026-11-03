import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { K8sResourceCommon, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

import { getProjectNetworkSettings, type ProjectNetworkSettings } from '../selectors';

type UseProjectNetworkSettingsArgs = {
  namespaceName?: string;
};

type UseProjectNetworkSettingsReturn = {
  error: unknown;
  loaded: boolean;
  namespace?: K8sResourceCommon;
} & ProjectNetworkSettings;

const useProjectNetworkSettings = ({
  namespaceName,
}: UseProjectNetworkSettingsArgs): UseProjectNetworkSettingsReturn => {
  const [namespace, loaded, error] = useK8sWatchResource<K8sResourceCommon>(
    namespaceName
      ? {
          groupVersionKind: modelToGroupVersionKind(NamespaceModel),
          name: namespaceName,
        }
      : null,
  );

  const { defaultNadName, isPodNetworkAllowed } = getProjectNetworkSettings(namespace);

  return {
    defaultNadName,
    error,
    isPodNetworkAllowed,
    loaded,
    namespace,
  };
};

export default useProjectNetworkSettings;
