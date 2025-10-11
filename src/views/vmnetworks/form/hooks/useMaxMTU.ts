import {
  V1beta1NodeNetworkState,
  V1NodeNetworkConfigurationPolicySpec,
} from '@kubevirt-ui/kubevirt-api/nmstate';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { NodeNetworkStateModelGroupVersionKind } from '@utils/models';

import { getBridgeMTU, getBridgeNames } from '../utils/ovsBridge';

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

  const mtuList: number[] = [];

  nncpSpecList?.forEach((nncpSpec) => {
    const bridgeNames = getBridgeNames(localnet, nncpSpec);
    bridgeNames?.forEach((bridgeName) => {
      const mtu = getBridgeMTU(bridgeName, nncpSpec, nodeNetworkStates?.[0]);
      mtuList.push(mtu);
    });
  });

  return Math.min(...mtuList);
};

export default useMaxMTU;
