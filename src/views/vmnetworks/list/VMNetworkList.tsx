import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import {
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  ListPageHeader,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import KubevirtTable from '@utils/components/KubevirtTable/KubevirtTable';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModelGroupVersionKind } from '@utils/models';
import { getName } from '@utils/resources/shared';
import { LOCALNET_TOPOLOGY } from '@utils/resources/udns/constants';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

import { VM_NETWORKS_PATH } from '../constants';

import useVMNetworkTableColumns from './hooks/useVMNetworkTableColumns';

const VMNetworkList: FC = () => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  const [resources, loaded, loadError] = useK8sWatchResource<ClusterUserDefinedNetworkKind[]>({
    groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
    isList: true,
    namespaced: false,
  });

  const allVMNetworks = resources?.filter(
    (resource) => resource.spec.network.topology === LOCALNET_TOPOLOGY,
  );
  const [data, filteredData, onFilterChange] = useListPageFilter(allVMNetworks);
  const columns = useVMNetworkTableColumns();

  const title = t('Virtual Machine Networks');

  const onCreate = () => {
    navigate(`${VM_NETWORKS_PATH}/~new`);
  };

  return (
    <ListEmptyState<ClusterUserDefinedNetworkKind>
      data={data}
      error={loadError}
      kind={t('Virtual Machine Network')}
      learnMoreLink={getDocumentationURL(documentationURLs.vmNetworking)}
      loaded={loaded}
      onCreate={onCreate}
      title={title}
    >
      <ListPageHeader title={title}>
        <ListPageCreateButton
          createAccessReview={{
            groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
          }}
          onClick={onCreate}
        >
          {t('Create Virtual Machine Network')}
        </ListPageCreateButton>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <KubevirtTable<ClusterUserDefinedNetworkKind>
          ariaLabel={t('VM Networks table')}
          columns={columns}
          data={filteredData}
          getRowId={(row) => getName(row) ?? ''}
          loaded={loaded}
          loadError={loadError}
          noFilteredDataEmptyMsg={t('No virtual machine networks found')}
          unfilteredData={data}
        />
      </ListPageBody>
    </ListEmptyState>
  );
};

export default VMNetworkList;
