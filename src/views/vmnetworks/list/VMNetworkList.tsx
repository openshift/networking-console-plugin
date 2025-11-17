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
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModelGroupVersionKind } from '@utils/models';
import { LOCALNET_TOPOLOGY } from '@utils/resources/udns/constants';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

import VMNetworkRow from './components/VMNetworkRow';
import useVMNetworkColumns from './hooks/useVMNetworkColumns';

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
  const columns = useVMNetworkColumns();

  const title = t('VirtualMachine networks');

  const onCreate = () => {
    navigate('/k8s/cluster/virtualmachine-networks/~new');
  };

  return (
    <ListEmptyState<ClusterUserDefinedNetworkKind>
      data={data}
      error={loadError}
      kind={t('VirtualMachine network')}
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
          {t('Create VirtualMachine network')}
        </ListPageCreateButton>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <VirtualizedTable<ClusterUserDefinedNetworkKind>
          columns={columns}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={VMNetworkRow}
          unfilteredData={data}
        />
      </ListPageBody>
    </ListEmptyState>
  );
};

export default VMNetworkList;
