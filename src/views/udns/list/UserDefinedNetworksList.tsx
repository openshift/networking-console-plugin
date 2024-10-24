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
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { resourcePathFromModel } from '@utils/resources/shared';
import { UserDefinedNetworkKind } from '@utils/resources/udns/types';
import {
  UserDefinedNetworkModel,
  UserDefinedNetworkModelGroupVersionKind,
} from '@utils/resources/udns/utils';

import UserDefinedNetworkRow from './components/UserDefinedNetworkRow';
import useUDNColumns from './hooks/useUDNColumns';

type UserDefinedNetworksListProps = {
  namespace: string;
};

const UserDefinedNetworksList: FC<UserDefinedNetworksListProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  const [udns, loaded, loadError] = useK8sWatchResource<UserDefinedNetworkKind[]>({
    groupVersionKind: UserDefinedNetworkModelGroupVersionKind,
    isList: true,
    namespace,
  });

  const [data, filteredData, onFilterChange] = useListPageFilter(udns);
  const columns = useUDNColumns();
  const title = t('UserDefinedNetworks');

  return (
    <ListEmptyState<UserDefinedNetworkKind>
      createButtonlink={SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}
      data={data}
      error={loadError}
      kind={UserDefinedNetworkModel.kind}
      learnMoreLink="https://docs.openshift.com/container-platform/4.17/networking/multiple_networks/understanding-user-defined-network.html"
      loaded={loaded}
      title={title}
    >
      <ListPageHeader title={title}>
        <ListPageCreateButton
          className="list-page-create-button-margin"
          createAccessReview={{
            groupVersionKind: UserDefinedNetworkModelGroupVersionKind,
            namespace,
          }}
          onClick={() =>
            navigate(
              `${resourcePathFromModel(
                UserDefinedNetworkModel,
                null,
                namespace || DEFAULT_NAMESPACE,
              )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`,
            )
          }
        >
          {t('Create UserDefinedNetwork')}
        </ListPageCreateButton>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <VirtualizedTable<UserDefinedNetworkKind>
          columns={columns}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={UserDefinedNetworkRow}
          unfilteredData={data}
        />
      </ListPageBody>
    </ListEmptyState>
  );
};

export default UserDefinedNetworksList;
