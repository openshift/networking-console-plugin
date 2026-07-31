import { useMemo } from 'react';

import { PodModel, ProjectModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Pod } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  K8sResourceCommon,
  Selector,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { safeSelector, selectorError } from '@utils/utils/selector';

type UseNetworkPolicyPodPreviewDataArgs = {
  namespaceSelector: string[][];
  podSelector: string[][];
};

type UseNetworkPolicyPodPreviewDataReturnValues = {
  error: string;
  loaded: boolean;
  namespaces: K8sResourceCommon[];
  pods: IoK8sApiCoreV1Pod[];
  safeNsSelector: Selector;
  safePodSelector: Selector;
};

type UseNetworkPolicyPodPreviewData = (
  args: UseNetworkPolicyPodPreviewDataArgs,
) => UseNetworkPolicyPodPreviewDataReturnValues;

const useNetworkPolicyPodPreviewData: UseNetworkPolicyPodPreviewData = ({
  namespaceSelector,
  podSelector,
}) => {
  const [namespace] = useActiveNamespace();

  const [safeNsSelector, offendingNsSelector] = useMemo(
    () => safeSelector(namespaceSelector),
    [namespaceSelector],
  );

  const [safePodSelector, offendingPodSelector] = useMemo(
    () => safeSelector(podSelector),
    [podSelector],
  );

  const [pods, loadedPods, podsError] = useK8sWatchResource<IoK8sApiCoreV1Pod[]>({
    isList: true,
    kind: PodModel.kind,
    namespace,
    selector: safePodSelector,
  });

  const [namespaces, loadedNamespaces, namespacesError] = useK8sWatchResource<K8sResourceCommon[]>({
    isList: true,
    kind: ProjectModel.kind,
    selector: safeNsSelector,
  });

  return {
    error:
      selectorError(offendingPodSelector || offendingNsSelector) || podsError || namespacesError,
    loaded: loadedPods && loadedNamespaces,
    namespaces,
    pods,
    safeNsSelector,
    safePodSelector,
  };
};

export default useNetworkPolicyPodPreviewData;
