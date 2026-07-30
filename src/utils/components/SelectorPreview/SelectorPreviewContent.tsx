import React, { FC, useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { K8sModel, K8sResourceCommon, ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertVariant, Label, List, ListItem } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';

import useSelectorPreviewData from './hooks/useSelectorPreviewData';
import { maxPreviewResources } from './utils/const';
import { labelsFilterQuery, matchedNamespaces, resourceListPathFromModel } from './utils/utils';

type SelectorPreviewContentProps = {
  labelSelector?: string[][];
  namespace?: string;
  namespaceSelector?: string[][];
  resourceModel: K8sModel;
};

const getResourceLabel = (resource: K8sResourceCommon, showNamespace: boolean) => {
  const name = getName(resource);
  const ns = getNamespace(resource);
  return showNamespace && ns ? `${ns}/${name}` : name;
};

const SelectorPreviewContent: FC<SelectorPreviewContentProps> = ({
  labelSelector,
  namespace,
  namespaceSelector,
  resourceModel,
}) => {
  const { t } = useNetworkingTranslation();
  const { error, loaded, namespaces, resources, safeLabelSelector, safeNsSelector } =
    useSelectorPreviewData({
      labelSelector,
      namespace,
      namespaceSelector,
      resourceModel,
    });

  const { filteredResources, total } = useMemo(() => {
    if (!loaded) {
      return { filteredResources: [], total: 0 };
    }

    let matched = resources;
    if (namespaceSelector) {
      const nsSet = matchedNamespaces(namespaces);
      matched = matched.filter(
        (resource) => resource.metadata?.namespace && nsSet.has(resource.metadata.namespace),
      );
    }

    return {
      filteredResources: matched.slice(0, maxPreviewResources),
      total: matched.length,
    };
  }, [loaded, namespaceSelector, namespaces, resources]);

  const labelsArray = Object.entries(safeLabelSelector.matchLabels || {});
  const labelList = labelsArray.map(([label, value]) => `${label}=${value}`);
  const showNamespace =
    Boolean(namespaceSelector) ||
    filteredResources.some(
      (resource) => getNamespace(resource) && getNamespace(resource) !== namespace,
    );

  if (error) {
    return (
      <Alert
        data-test="selector-preview-alert"
        isInline
        title={t("Can't preview matching resources")}
        variant={AlertVariant.danger}
      >
        {error.toString()}
      </Alert>
    );
  }

  if (!loaded) {
    return <Loading />;
  }

  if (isEmpty(filteredResources)) {
    return (
      <div data-test="selector-preview-title">{t('No resources matching the provided labels')}</div>
    );
  }

  return (
    <>
      <div data-test="selector-preview-title">
        {!isEmpty(labelList) ? (
          <>
            {t('List of resources matching')}{' '}
            {labelsArray.map(([label, value]) => (
              <Label color="green" key={label}>
                {label}={value}
              </Label>
            ))}
          </>
        ) : (
          t('List of matching resources')
        )}
      </div>
      <List data-test="selector-preview-list" isPlain>
        {filteredResources.map((resource) => (
          <ListItem key={`${getNamespace(resource)}/${getName(resource)}`}>
            <ResourceIcon groupVersionKind={modelToGroupVersionKind(resourceModel)} />{' '}
            {getResourceLabel(resource, showNamespace)}
          </ListItem>
        ))}
      </List>
      {total > maxPreviewResources && isEmpty(Object.keys(safeNsSelector.matchLabels || {})) ? (
        <a
          data-test="selector-preview-footer-link"
          href={`${resourceListPathFromModel(resourceModel, namespace)}${labelsFilterQuery(
            total,
            labelList,
          )}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('Showing {{shown}} from {{total}} results', {
            shown: maxPreviewResources,
            total,
          })}
        </a>
      ) : (
        <p data-test="selector-preview-footer">{t('View all {{total}} results', { total })}</p>
      )}
    </>
  );
};

export default SelectorPreviewContent;
