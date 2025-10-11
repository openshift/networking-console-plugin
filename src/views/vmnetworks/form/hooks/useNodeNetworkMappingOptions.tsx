import { useMemo } from 'react';

import {
  V1NodeNetworkConfigurationPolicy,
  V1NodeNetworkConfigurationPolicySpec,
} from '@kubevirt-ui/kubevirt-api/nmstate';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { SelectOptionProps } from '@patternfly/react-core';
import { NodeNetworkConfigurationPolicyModelGroupVersionKind } from '@utils/models';

import { OVN_BRIDGE_MAPPINGS } from '../constants';

const useNodeNetworkMappingOptions = (): [
  SelectOptionProps[],
  Record<string, V1NodeNetworkConfigurationPolicySpec[]>,
  boolean,
  Error,
] => {
  const [policies, policiesLoaded, policiesLoadError] = useK8sWatchResource<
    V1NodeNetworkConfigurationPolicy[]
  >({
    groupVersionKind: NodeNetworkConfigurationPolicyModelGroupVersionKind,
    isList: true,
    namespaced: false,
  });

  const nncpSpecListForLocalnet = useMemo(() => {
    const result: Record<string, V1NodeNetworkConfigurationPolicySpec[]> = {};

    policies?.forEach((policy) => {
      policy.spec?.desiredState?.ovn?.[OVN_BRIDGE_MAPPINGS]?.forEach((mapping) => {
        const localnet = mapping.localnet;
        if (!localnet.startsWith('physnet')) {
          if (!result[localnet]) {
            result[localnet] = [];
          }
          if (!result[localnet].includes(policy.spec)) {
            result[localnet].push(policy.spec);
          }
        }
      });
    });

    return result;
  }, [policies]);

  const nodeNetworkMappingOptions = useMemo(() => {
    return Object.keys(nncpSpecListForLocalnet).map((option) => ({
      children: option,
      key: option,
      value: option,
    }));
  }, [nncpSpecListForLocalnet]);

  return [nodeNetworkMappingOptions, nncpSpecListForLocalnet, policiesLoaded, policiesLoadError];
};

export default useNodeNetworkMappingOptions;
