import { useMemo } from 'react';

import { K8sModel, useK8sModels } from '@openshift-console/dynamic-plugin-sdk';

// These are the same missing color overrides used by NetObserv's
// useK8sModelsWithColors hook.
const K8S_MODEL_COLOR_OVERRIDES: Record<string, string> = {
  Alert: '#2B9AF3',
  AlertManager: '#773D00',
  AlertRule: '#40199A',
  Application: '#3E8635',
  ClusterRole: '#795600',
  ClusterRoleBinding: '#008BAD',
  ConfigMap: '#40199A',
  Container: '#2B9AF3',
  DaemonSet: '#004080',
  Deployment: '#004080',
  DeploymentConfig: '#004080',
  Ingress: '#1F0066',
  Job: '#004080',
  Machine: '#8476D1',
  MachineAutoscaler: '#8476D1',
  MachineClass: '#8476D1',
  MachineConfig: '#8476D1',
  MachineConfigPool: '#8476D1',
  MachineDeployment: '#8476D1',
  MachineHealthCheck: '#8476D1',
  MachineSet: '#8476D1',
  Namespace: '#1E4F18',
  Node: '#8476D1',
  Pod: '#009596',
  Policy: '#8476D1',
  Project: '#1E4F18',
  ReplicaSet: '#004080',
  ReplicationController: '#004080',
  Role: '#795600',
  RoleBinding: '#008BAD',
  Secret: '#C46100',
  Service: '#3E8635',
  ServiceAccount: '#40199A',
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
