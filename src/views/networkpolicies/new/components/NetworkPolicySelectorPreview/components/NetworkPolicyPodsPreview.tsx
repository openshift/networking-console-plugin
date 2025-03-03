import React, { FC, useMemo } from 'react';

import {
  modelToGroupVersionKind,
  NamespaceModel,
  PodModel,
} from '@kubevirt-ui/kubevirt-api/console';
import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertVariant, Label, TreeView, TreeViewDataItem } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import { maxPreviewPods } from '../utils/const';
import { matchedNs, podsFilterQuery, resourceListPathFromModel } from '../utils/utils';

import useNetworkPolicyPodPreviewData from './hooks/useNetworkPolicyPodPreviewData';

import './tree-view.css';

type NetworkPolicyPodsPreviewProps = {
  namespace?: string;
  namespaceSelector?: string[][];
  podSelector: string[][];
};

const NetworkPolicyPodsPreview: FC<NetworkPolicyPodsPreviewProps> = ({
  namespace,
  namespaceSelector,
  podSelector,
}) => {
  const { t } = useNetworkingTranslation();
  const { error, loaded, namespaces, pods, safeNsSelector, safePodSelector } =
    useNetworkPolicyPodPreviewData({ namespaceSelector, podSelector });

  // takes the first 'maxPreviewPods' received pods and groups them by namespace
  const preview: {
    pods?: TreeViewDataItem[];
    total?: number;
  } = useMemo(() => {
    if (!loaded) {
      return { pods: [], total: 0 };
    }
    // If there is a defined namespace selector, filter pods to remove
    // those from non-matching namespaces
    let filteredPods = pods;
    if (namespaceSelector) {
      filteredPods = filteredPods.filter(
        (pod) => pod.metadata.namespace && matchedNs(namespaces).has(pod.metadata.namespace),
      );
    }
    // Group pod TreeViewDataItem by namespace, up to a maximum of maxPreviewedPods entries
    const podsByNs: { [key: string]: TreeViewDataItem[] } = {};
    filteredPods.slice(0, maxPreviewPods).forEach((pod) => {
      const ns = pod?.metadata?.namespace;
      podsByNs[ns] ??= [];
      podsByNs[ns].push({
        icon: <ResourceIcon groupVersionKind={modelToGroupVersionKind(PodModel)} />,
        name: pod?.metadata?.name,
      });
    });
    // Then convert the above groups of pod TreeViewDataItems to subchildren of
    // the namespaces' TreeViewDataItems
    const podTreeEntries = Object.entries(podsByNs).map(
      ([ns, podsTree]): TreeViewDataItem => ({
        children: podsTree,
        defaultExpanded: true,
        icon: <ResourceIcon kind={NamespaceModel.kind} />,
        name: ns,
      }),
    );
    return {
      pods: podTreeEntries,
      total: filteredPods.length,
    };
  }, [loaded, namespaceSelector, namespaces, pods]);

  const labelsArray: string[][] = Object.entries(safePodSelector.matchLabels || {});
  const labelList = labelsArray.map(([label, value]) => `${label}=${value}`);
  const labelBadges = labelsArray.map(([label, value]) => (
    <Label color="green" key={label} value={value}>
      {label}={value}
    </Label>
  ));

  if (error) {
    return (
      <Alert
        data-test="pods-preview-alert"
        isInline
        title={t("Can't preview pods")}
        variant={AlertVariant.danger}
      >
        {error.toString()}
      </Alert>
    );
  }

  if (loaded && isEmpty(preview?.pods)) {
    return (
      <div data-test="pods-preview-title">
        {t('No pods matching the provided labels in the current namespace')}
      </div>
    );
  }

  if (!loaded) {
    return <Loading />;
  }

  return (
    <>
      <div data-test="pods-preview-title">
        {!isEmpty(labelList) ? (
          <>
            {t('List of pods matching')} {labelBadges}
          </>
        ) : (
          t('List of pods')
        )}
      </div>
      <TreeView
        className="network-policy-pods-preview"
        data={preview?.pods}
        data-test="pods-preview-tree"
        hasGuides
      />
      {preview?.total > maxPreviewPods && isEmpty(Object.keys(safeNsSelector.matchLabels)) ? (
        <a
          data-test="pods-preview-footer-link"
          href={`${resourceListPathFromModel(PodModel, namespace)}${podsFilterQuery(preview?.total, labelList)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('Showing {{shown}} from {{total}} results', {
            shown: maxPreviewPods,
            total: preview.total,
          })}
        </a>
      ) : (
        <p data-test="pods-preview-footer">
          {t('View all {{total}} results', {
            total: preview.total,
          })}
        </p>
      )}
    </>
  );
};

export default NetworkPolicyPodsPreview;
