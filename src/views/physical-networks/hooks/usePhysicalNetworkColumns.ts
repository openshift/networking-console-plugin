import { useCallback, useMemo, useState } from 'react';

import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import type { ThSortType } from '@patternfly/react-table/dist/esm/components/Table/base/types';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { PaginationState } from '@utils/hooks/usePagination/utils/types';
import { columnSorting } from '@utils/utils/sorting';

import { PhysicalNetwork } from '../utils/types';

export enum PhysicalNetworkColumnIDs {
  Actions = 'actions',
  DesiredConfiguration = 'desiredConfiguration',
  Expand = 'expand',
  Name = 'name',
  ObservedMapping = 'observedMapping',
  ReferencedBy = 'referencedBy',
}

const usePhysicalNetworkColumns = (
  data: PhysicalNetwork[],
  pagination: PaginationState,
): {
  columns: TableColumn<PhysicalNetwork>[];
  getSortType: (columnIndex: number) => ThSortType;
  sortedData: PhysicalNetwork[];
} => {
  const { t } = useNetworkingTranslation();
  const [activeSortIndex, setActiveSortIndex] = useState<null | number>(null);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | null>(null);

  const columns: TableColumn<PhysicalNetwork>[] = useMemo(
    () => [
      { id: PhysicalNetworkColumnIDs.Expand, title: '' },
      {
        id: PhysicalNetworkColumnIDs.Name,
        props: { className: 'pf-m-width-25' },
        sort: 'name',
        title: t('Network name'),
        transforms: [sortable],
      },
      { id: PhysicalNetworkColumnIDs.ReferencedBy, title: t('Referenced by') },
      { id: PhysicalNetworkColumnIDs.DesiredConfiguration, title: t('Desired configuration') },
      { id: PhysicalNetworkColumnIDs.ObservedMapping, title: t('Observed mapping') },
      { id: PhysicalNetworkColumnIDs.Actions, title: '' },
    ],
    [t],
  );

  const getSortType = useCallback(
    (columnIndex: number): ThSortType => ({
      columnIndex,
      onSort: (_event, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      },
      sortBy: { direction: activeSortDirection, index: activeSortIndex },
    }),
    [activeSortDirection, activeSortIndex],
  );

  const sortedData = useMemo(
    () =>
      activeSortDirection
        ? columnSorting(
            [...data],
            activeSortDirection,
            pagination,
            columns[activeSortIndex]?.sort as string,
          )
        : data.slice(pagination.startIndex, pagination.endIndex),
    [activeSortDirection, activeSortIndex, columns, data, pagination],
  );

  return { columns, getSortType, sortedData };
};

export default usePhysicalNetworkColumns;
