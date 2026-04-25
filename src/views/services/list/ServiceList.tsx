import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  ListPageHeader,
  useActiveNamespace,
  useK8sWatchResource,
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

type ServiceListProps = {
  kind: string;
  namespace: string;
};

const ServiceList: FC<ServiceListProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [activeNamespace] = useActiveNamespace();
  const validNamespace = getValidNamespace(namespace || activeNamespace);

  const [service, loaded, loadError] = useK8sWatchResource<IoK8sApiCoreV1Service[]>({
    groupVersionKind: modelToGroupVersionKind(ServiceModel),
    isList: true,
    namespace,
  });

  const [data, filteredData, onFilterChange] = useListPageFilter(service);
  const columns = useServiceColumn();

  const serviceCreateFormLink = `${resourcePathFromModel(
    ServiceModel,
    null,
    validNamespace,
  )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`;

  const title = t('Services');

  return (
    <ListEmptyState<IoK8sApiCoreV1Service>
      createButtonlink={serviceCreateFormLink}
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
        <VirtualizedTable<IoK8sApiCoreV1Service>
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
