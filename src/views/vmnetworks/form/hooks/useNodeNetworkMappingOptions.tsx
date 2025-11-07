import { useMemo } from 'react';

import {
  V1NodeNetworkConfigurationPolicy,
  V1NodeNetworkConfigurationPolicySpec,
} from '@kubevirt-ui/kubevirt-api/nmstate';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { SelectOptionProps } from '@patternfly/react-core';
import { NodeNetworkConfigurationPolicyModelGroupVersionKind } from '@utils/models';

import { getNNCPSpecListForLocalnetObject } from '../utils/utils';

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

  const nncpSpecListForLocalnet = useMemo(
    () => getNNCPSpecListForLocalnetObject(policies),
    [policies],
  );

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
