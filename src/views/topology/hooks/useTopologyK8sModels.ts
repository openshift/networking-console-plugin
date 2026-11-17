import { useMemo } from 'react';

import { K8sModel, useK8sModels } from '@openshift-console/dynamic-plugin-sdk';

// These are the same missing color overrides used by NetObserv's
// useK8sModelsWithColors hook.
const K8S_MODEL_COLOR_OVERRIDES: Record<string, string> = {
  ClusterUserDefinedNetwork: '#2B9AF3',
  DaemonSet: '#004080',
  Deployment: '#004080',
  DeploymentConfig: '#004080',
  Ingress: '#1F0066',
  Job: '#004080',
  Namespace: '#1E4F18',
  NetworkAttachmentDefinition: '#2B9AF3',
  Pod: '#009596',
  Project: '#1E4F18',
  ReplicaSet: '#004080',
  ReplicationController: '#004080',
  Service: '#3E8635',
  StatefulSet: '#004080',
  UserDefinedNetwork: '#2B9AF3',
  VirtualMachine: '#2B9AF3',
};

const useTopologyK8sModels = (): Record<string, K8sModel> => {
  const [k8sModels, inFlight] = useK8sModels();

  return useMemo(() => {
    if (inFlight || !k8sModels) return k8sModels ?? {};

    return Object.fromEntries(
      Object.entries(k8sModels).map(([key, model]) => [
        key,
        K8S_MODEL_COLOR_OVERRIDES[model.kind]
          ? { ...model, color: K8S_MODEL_COLOR_OVERRIDES[model.kind] }
          : model,
      ]),
    );
  }, [inFlight, k8sModels]);
};

export default useTopologyK8sModels;
