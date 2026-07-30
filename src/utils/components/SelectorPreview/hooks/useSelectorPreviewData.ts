import { useMemo } from 'react';

import { modelToGroupVersionKind, ProjectModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  K8sModel,
  K8sResourceCommon,
  Selector,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';

import { safeSelector, selectorError } from '../utils/utils';

type UseSelectorPreviewDataArgs = {
  labelSelector?: string[][];
  namespace?: string;
  namespaceSelector?: string[][];
  resourceModel: K8sModel;
};

type UseSelectorPreviewDataReturnValues = {
  error: string;
  loaded: boolean;
  namespaces: K8sResourceCommon[];
  resources: K8sResourceCommon[];
  safeLabelSelector: Selector;
  safeNsSelector: Selector;
};

const useSelectorPreviewData = ({
  labelSelector,
  namespace: namespaceProp,
  namespaceSelector,
  resourceModel,
}: UseSelectorPreviewDataArgs): UseSelectorPreviewDataReturnValues => {
  const [activeNamespace] = useActiveNamespace();
  const namespace = namespaceProp || activeNamespace;
  const hasNamespaceSelector = namespaceSelector !== undefined;

  const [safeNsSelector, offendingNsSelector] = useMemo(
    () => safeSelector(namespaceSelector),
    [namespaceSelector],
  );

  const [safeLabelSelector, offendingLabelSelector] = useMemo(
    () => safeSelector(labelSelector),
    [labelSelector],
  );

  // Empty matchLabels matches all resources — skip watches while a selector is invalid.
  const hasInvalidSelector = Boolean(offendingLabelSelector || offendingNsSelector);

  const [resources, loadedResources, resourcesError] = useK8sWatchResource<K8sResourceCommon[]>(
    hasInvalidSelector
      ? null
      : {
          groupVersionKind: modelToGroupVersionKind(resourceModel),
          isList: true,
          namespace: hasNamespaceSelector ? undefined : namespace,
          selector: safeLabelSelector,
        },
  );

  const [namespaces, loadedNamespaces, namespacesError] = useK8sWatchResource<K8sResourceCommon[]>(
    hasInvalidSelector
      ? null
      : {
          isList: true,
          kind: ProjectModel.kind,
          selector: safeNsSelector,
        },
  );

  return {
    error:
      selectorError(offendingLabelSelector || offendingNsSelector) ||
      resourcesError ||
      (hasNamespaceSelector ? namespacesError : undefined),
    loaded: hasInvalidSelector
      ? true
      : loadedResources && (hasNamespaceSelector ? loadedNamespaces : true),
    namespaces: hasInvalidSelector ? [] : namespaces || [],
    resources: hasInvalidSelector ? [] : resources || [],
    safeLabelSelector,
    safeNsSelector,
  };
};

export default useSelectorPreviewData;
