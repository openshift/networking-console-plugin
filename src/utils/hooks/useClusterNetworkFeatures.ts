import { useEffect, useState } from 'react';

import { ConfigMapModel, modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { K8sResourceKind, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

const networkConfigMapName = 'openshift-network-features';
const networkConfigMapNamespace = 'openshift-config-managed';
const policyEgressConfigKey = 'policy_egress';
const policyPeerIPBlockExceptionsConfigKey = 'policy_peer_ipblock_exceptions';

export enum ClusterNetworkFeature {
  PolicyEgress = 'PolicyEgress',
  PolicyPeerIPBlockExceptions = 'PolicyPeerIPBlockExceptions',
}

export type ClusterNetworkFeatures = {
  [key in ClusterNetworkFeature]?: boolean;
};

const getFeatureState = (data: { [key: string]: string }, key: string): boolean | undefined => {
  // Note: config map data comes as string, not bool
  return key in data ? data[key] === 'true' : undefined;
};

/**
 *  Fetches and returns the features supported by the Cluster Network Type
 *  (Openshift SDN, Kubernetes OVN ...) using a config map provided by the
 *  cluster network operator.
 *
 *  @async
 *  @returns [ClusterNetworkFeatures, boolean, any] - The asynchronously-loaded cluster network
 *  features, plus a boolean that is 'false' until the first value is loaded (or an error is
 *  returned)
 */
export const useClusterNetworkFeatures = (): [ClusterNetworkFeatures, boolean] => {
  const [features, setFeatures] = useState<ClusterNetworkFeatures>({});
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

  const [config, configLoaded] = useK8sWatchResource<K8sResourceKind>({
    groupVersionKind: modelToGroupVersionKind(ConfigMapModel),
    name: networkConfigMapName,
    namespace: networkConfigMapNamespace,
  });

  useEffect(() => {
    if (configLoaded) {
      if (config?.data) {
        setFeatures({
          PolicyEgress: getFeatureState(config.data, policyEgressConfigKey),
          PolicyPeerIPBlockExceptions: getFeatureState(
            config.data,
            policyPeerIPBlockExceptionsConfigKey,
          ),
        });
      }
      setFeaturesLoaded(true);
    }
  }, [config, configLoaded]);

  return [features, featuresLoaded];
};
