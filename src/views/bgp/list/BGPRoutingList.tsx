import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  ListPageBody,
  ListPageFilter,
  ResourceLink,
  RowProps,
  TableColumn,
  TableData,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { Label } from '@patternfly/react-core';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRoutingModel } from '@utils/models';
import { BGPRouting, condition } from '@utils/resources/bgp';
import { resourcePathFromModel } from '@utils/resources/shared';

import BGPListActions from '../components/BGPListActions';
import { BGPStatus } from '../components/BGPStatus';

const Row: FC<RowProps<BGPRouting>> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();
  const available = condition(obj.status?.conditions);
  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(BGPRoutingModel)}
          name={obj.metadata?.name}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="network">
        {obj.spec?.network?.name}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="subnets">
        {obj.spec?.network?.subnets?.join(', ')}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespaces">
        {obj.status?.namespaces?.length || 0}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="phase">
        <BGPStatus condition={available} phase={obj.status?.phase} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="availability">
        <Label color={available?.status === 'True' ? 'green' : 'red'}>
          {available?.status || t('Unknown')}
        </Label>
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="reason">
        {available?.reason || t('Not available')}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="created">
        {obj.metadata?.creationTimestamp
          ? new Date(obj.metadata.creationTimestamp).toLocaleString()
          : '-'}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="actions">
        <BGPListActions model={BGPRoutingModel} obj={obj} />
      </TableData>
    </>
  );
};
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
      { id: 'namespaces', title: t('Selected namespaces') },
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
      title={t('BGP routings')}
    >
      <>
        <ListPageBody>
          <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
          <VirtualizedTable
            columns={columns}
            data={filteredData}
            loaded={loaded}
            loadError={error}
            Row={Row}
            unfilteredData={data}
          />
        </ListPageBody>
      </>
    </ListEmptyState>
  );
};
export default BGPRoutingList;
