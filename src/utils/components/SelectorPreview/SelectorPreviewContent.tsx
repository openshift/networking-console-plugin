import React, { FC, useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { K8sModel, ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertVariant, Label, List, ListItem } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace, resourceListPathFromModel } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';
import { labelsFilterQuery, MAX_PREVIEW_RESOURCES } from '@utils/utils/selector';

import useSelectorPreviewData from './hooks/useSelectorPreviewData';

type SelectorPreviewContentProps = {
  labelSelector?: string[][];
  namespace?: string;
  resourceModel: K8sModel;
  resourceName: string;
};

const SelectorPreviewContent: FC<SelectorPreviewContentProps> = ({
  labelSelector,
  namespace,
  resourceModel,
  resourceName,
}) => {
  const { t } = useNetworkingTranslation();
  const { error, loaded, resources, safeLabelSelector } = useSelectorPreviewData({
    labelSelector,
    namespace,
    resourceModel,
  });

  const { filteredResources, total } = useMemo(() => {
    if (!loaded) {
      return { filteredResources: [], total: 0 };
    }

    return {
      filteredResources: resources.slice(0, MAX_PREVIEW_RESOURCES),
      total: resources.length,
    };
  }, [loaded, resources]);

  const labelsArray = Object.entries(safeLabelSelector.matchLabels || {});
  const labelList = labelsArray.map(([label, value]) => `${label}=${value}`);

  if (error) {
    return (
      <Alert
        data-test="selector-preview-alert"
        isInline
        title={t("Can't preview matching {{resourceName}}", { resourceName })}
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
      <div data-test="selector-preview-title">
        {t('No {{resourceName}} matching the provided labels', { resourceName })}
      </div>
    );
  }

  return (
    <>
      <div data-test="selector-preview-title">
        {!isEmpty(labelList) ? (
          <>
            {t('List of {{resourceName}} matching', { resourceName })}{' '}
            {labelsArray.map(([label, value]) => (
              <Label color="green" key={label}>
                {label}={value}
              </Label>
            ))}
          </>
        ) : (
          t('List of matching {{resourceName}}', { resourceName })
        )}
      </div>
      <List data-test="selector-preview-list" isPlain>
        {filteredResources.map((resource) => (
          <ListItem key={`${getNamespace(resource)}/${getName(resource)}`}>
            <ResourceIcon groupVersionKind={modelToGroupVersionKind(resourceModel)} />{' '}
            {getName(resource)}
          </ListItem>
        ))}
      </List>
      {total > MAX_PREVIEW_RESOURCES ? (
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
            shown: MAX_PREVIEW_RESOURCES,
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
