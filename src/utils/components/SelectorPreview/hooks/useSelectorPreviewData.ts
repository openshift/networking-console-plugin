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

  const [resources, loadedResources, resourcesError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: modelToGroupVersionKind(resourceModel),
    isList: true,
    namespace: hasNamespaceSelector ? undefined : namespace,
    selector: safeLabelSelector,
  });

  const [namespaces, loadedNamespaces, namespacesError] = useK8sWatchResource<K8sResourceCommon[]>({
    isList: true,
    kind: ProjectModel.kind,
    selector: safeNsSelector,
  });

  return {
    error:
      selectorError(offendingLabelSelector || offendingNsSelector) ||
      resourcesError ||
      (hasNamespaceSelector ? namespacesError : undefined),
    loaded: loadedResources && (hasNamespaceSelector ? loadedNamespaces : true),
    namespaces: namespaces || [],
    resources: resources || [],
    safeLabelSelector,
    safeNsSelector,
  };
};

export default useSelectorPreviewData;
