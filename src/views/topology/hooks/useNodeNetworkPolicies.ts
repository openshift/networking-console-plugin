import { V1NodeNetworkConfigurationPolicy } from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { useFlag, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { FLAG_NMSTATE_CRDS } from '@utils/flags/consts';
import { NodeNetworkConfigurationPolicyModelGroupVersionKind } from '@utils/models';

type UseNodeNetworkPoliciesResult = {
  nodeNetworkPolicies: V1NodeNetworkConfigurationPolicy[];
};

const useNodeNetworkPolicies = (): UseNodeNetworkPoliciesResult => {
  const nmstateAvailable = useFlag(FLAG_NMSTATE_CRDS);
  const [data] = useK8sWatchResource<V1NodeNetworkConfigurationPolicy[]>(
    nmstateAvailable
      ? {
          groupVersionKind: NodeNetworkConfigurationPolicyModelGroupVersionKind,
          isList: true,
          namespaced: false,
          optional: true,
        }
      : null,
  );

  return { nodeNetworkPolicies: data ?? [] };
};

export default useNodeNetworkPolicies;
