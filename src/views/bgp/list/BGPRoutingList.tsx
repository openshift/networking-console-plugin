import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  ListPageBody,
  ListPageFilter,
  TableColumn,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRoutingModel } from '@utils/models';
import { BGPRouting } from '@utils/resources/bgp/types';
import { resourcePathFromModel } from '@utils/resources/shared';

import BGPRoutingRow from './components/BGPRoutingRow';
const BGPRoutingList: FC = () => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [items, loaded, error] = useK8sWatchResource<BGPRouting[]>({
    groupVersionKind: modelToGroupVersionKind(BGPRoutingModel),
    isList: true,
  });
  const [data, filteredData, onFilterChange] = useListPageFilter(items);
  const columns = useMemo<TableColumn<BGPRouting>[]>(
    () => [
      { id: 'name', title: t('Name') },
      { id: 'network', title: t('Network') },
      { id: 'subnets', title: t('Advertised subnets') },
      { id: 'phase', title: t('Phase') },
      { id: 'availability', title: t('Availability') },
      { id: 'reason', title: t('Reason') },
      { id: 'created', title: t('Created') },
      { id: 'actions', title: t('Actions') },
    ],
    [t],
  );
  const createPath = `${resourcePathFromModel(BGPRoutingModel)}/~new/form`;
  return (
    <ListEmptyState
      data={data}
      error={error}
      kind={BGPRoutingModel.kind}
      learnMoreLink="https://docs.openshift.com/container-platform/latest/networking/"
      loaded={loaded}
      onCreate={() => navigate(createPath)}
    >
      <>
        <ListPageBody>
          <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
          <VirtualizedTable
            columns={columns}
            data={filteredData}
            loaded={loaded}
            loadError={error}
            Row={BGPRoutingRow}
            unfilteredData={data}
          />
        </ListPageBody>
      </>
    </ListEmptyState>
  );
};
export default BGPRoutingList;
