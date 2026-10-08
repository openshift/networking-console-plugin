import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import {
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  ListPageHeader,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { DEFAULT_NAMESPACE } from '@utils/constants';
import { DOC_URL_NETWORK_SERVICE } from '@utils/constants/documentation';
import {
  SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM,
  SHARED_DEFAULT_PATH_NEW_RESOURCE_YAML,
} from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getGroupVersionKindForModel, ServiceModel } from '@utils/models';
import { resourcePathFromModel } from '@utils/resources/shared';
import { Service } from '@utils/types/k8sTypes';

import ServiceRow from './components/ServiceRow';
import useServiceColumn from './hooks/useServiceColumn';

type ServiceListProps = {
  kind: string;
  namespace: string;
};

const ServiceList: FC<ServiceListProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  const [service, loaded, loadError] = useK8sWatchResource<Service[]>({
    groupVersionKind: getGroupVersionKindForModel(ServiceModel),
    isList: true,
    namespace,
  });

  const [data, filteredData, onFilterChange] = useListPageFilter(service);
  const columns = useServiceColumn();
  const title = t('Services');

  return (
    <ListEmptyState<Service>
      createButtonlink={SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}
      data={data}
      error={loadError}
      kind={ServiceModel.kind}
      learnMoreLink={DOC_URL_NETWORK_SERVICE}
      loaded={loaded}
      title={title}
    >
      <ListPageHeader title={t('Services')}>
        <ListPageCreateButton
          className="list-page-create-button-margin"
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(ServiceModel),
            namespace,
          }}
          onClick={() =>
            navigate(
              `${resourcePathFromModel(
                ServiceModel,
                null,
                namespace || DEFAULT_NAMESPACE,
              )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_YAML}`,
            )
          }
        >
          {t('Create Service')}
        </ListPageCreateButton>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <VirtualizedTable<Service>
          columns={columns}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={ServiceRow}
          unfilteredData={data}
        />
      </ListPageBody>
    </ListEmptyState>
  );
};

export default ServiceList;
