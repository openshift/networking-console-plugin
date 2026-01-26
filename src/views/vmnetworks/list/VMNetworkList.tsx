import React, { FC } from 'react';

import {
  ListPageBody,
  ListPageFilter,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import ListErrorState from '@utils/components/ListEmptyState/ListErrorState';
import ListSkeleton from '@utils/components/ListEmptyState/ListSkeleton';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';

import useVMNetworks from '../hooks/useVMNetworks';

import LocalnetEmptyState from './components/LocalnetEmptyState/LocalnetEmptyState';
import VMNetworkRow from './components/VMNetworkRow';
import useVMNetworkColumns from './hooks/useVMNetworkColumns';

type VMNetworkListProps = {
  onCreate: () => void;
};

const VMNetworkList: FC<VMNetworkListProps> = ({ onCreate }) => {
  const [vmNetworks, loaded, error] = useVMNetworks();
  const [data, filteredData, onFilterChange] = useListPageFilter(vmNetworks);
  const columns = useVMNetworkColumns();

  if (error) return <ListErrorState error={error} />;

  if (!loaded)
    return (
      <ListPageBody>
        <ListSkeleton />
      </ListPageBody>
    );

  if (isEmpty(data)) return <LocalnetEmptyState onCreate={onCreate} />;

  return (
    <ListPageBody>
      <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
      <VirtualizedTable<ClusterUserDefinedNetworkKind>
        columns={columns}
        data={filteredData}
        loaded={loaded}
        loadError={error}
        Row={VMNetworkRow}
        unfilteredData={data}
      />
    </ListPageBody>
  );
};

export default VMNetworkList;
