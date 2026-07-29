import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  ListPageHeader,
  useActiveNamespace,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { DOC_URL_NETWORK_SERVICE } from '@utils/constants/documentation';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { resourcePathFromModel } from '@utils/resources/shared';
import { getValidNamespace } from '@utils/utils';

import ServiceRow from './components/ServiceRow';
import useServiceColumn from './hooks/useServiceColumn';
import { ServiceWithHealth, useServiceListViewData } from './hooks/useServiceListViewData';

type ServiceListProps = {
  kind: string;
  namespace: string;
};

const ServiceList: FC<ServiceListProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [activeNamespace] = useActiveNamespace();
  const validNamespace = getValidNamespace(namespace || activeNamespace);

  const { data: services, error: loadError, loaded } = useServiceListViewData(namespace);

  const [data, filteredData, onFilterChange] = useListPageFilter(services);
  const columns = useServiceColumn();

  const serviceCreateFormLink = `${resourcePathFromModel(
    ServiceModel,
    undefined,
    validNamespace,
  )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`;

  const title = t('Services');

  return (
    <ListEmptyState<ServiceWithHealth>
      createButtonLink={serviceCreateFormLink}
      data={data}
      error={loadError}
      kind={ServiceModel.kind}
      learnMoreLink={DOC_URL_NETWORK_SERVICE}
      loaded={loaded}
      title={title}
    >
      <ListPageHeader title={title}>
        <ListPageCreateButton
          className="list-page-create-button-margin"
          createAccessReview={{
            groupVersionKind: modelToGroupVersionKind(ServiceModel),
            namespace: validNamespace,
          }}
          onClick={() => navigate(serviceCreateFormLink)}
        >
          {t('Create Service')}
        </ListPageCreateButton>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <VirtualizedTable<ServiceWithHealth>
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
