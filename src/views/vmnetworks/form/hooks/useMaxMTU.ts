import {
  V1beta1NodeNetworkState,
  V1NodeNetworkConfigurationPolicySpec,
} from '@kubevirt-ui/kubevirt-api/nmstate';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NodeNetworkStateModelGroupVersionKind } from '@utils/models';

import { getBridgeMTU, getBridgeNames } from '../utils/utils';

const useMaxMTU = (
  localnet: string,
  nncpSpecListForLocalnet: Record<string, V1NodeNetworkConfigurationPolicySpec[]>,
) => {
  const [nodeNetworkStates] = useK8sWatchResource<V1beta1NodeNetworkState[]>({
    groupVersionKind: NodeNetworkStateModelGroupVersionKind,
    isList: true,
    namespaced: false,
  });

  const nncpSpecList = nncpSpecListForLocalnet[localnet];

  const mtuList =
    nncpSpecList?.flatMap(
      (nncpSpec) =>
        getBridgeNames(localnet, nncpSpec)?.map((bridgeName) =>
          getBridgeMTU(bridgeName, nncpSpec, nodeNetworkStates?.[0]),
        ) ?? [],
    ) ?? [];

  return Math.min(...mtuList);
};

export default useMaxMTU;
