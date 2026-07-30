import { useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import {
  K8sModel,
  K8sResourceCommon,
  Selector,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { safeSelector, selectorError } from '@utils/utils/selector';

type UseSelectorPreviewData = ({
  labelSelector,
  namespace,
  resourceModel,
}: {
  labelSelector?: string[][];
  namespace?: string;
  resourceModel: K8sModel;
}) => {
  error: string;
  loaded: boolean;
  resources: K8sResourceCommon[];
  safeLabelSelector: Selector;
};

const useSelectorPreviewData: UseSelectorPreviewData = ({
  labelSelector,
  namespace: namespaceProp,
  resourceModel,
}) => {
  const [activeNamespace] = useActiveNamespace();
  const namespace = namespaceProp || activeNamespace;

  const [safeLabelSelector, offendingLabelSelector] = useMemo(
    () => safeSelector(labelSelector),
    [labelSelector],
  );

  // Empty matchLabels matches all resources — skip watches while a selector is invalid.
  const hasInvalidSelector = Boolean(offendingLabelSelector);

  const [resources, loadedResources, resourcesError] = useK8sWatchResource<K8sResourceCommon[]>(
    hasInvalidSelector
      ? null
      : {
          groupVersionKind: modelToGroupVersionKind(resourceModel),
          isList: true,
          namespace,
          selector: safeLabelSelector,
        },
  );

  return {
    error: selectorError(offendingLabelSelector) || resourcesError,
    loaded: hasInvalidSelector ? true : loadedResources,
    resources: hasInvalidSelector ? [] : resources || [],
    safeLabelSelector,
  };
};

export default useSelectorPreviewData;
