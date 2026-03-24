import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { SortByDirection, Table, Tbody, Td, Th, Thead, ThProps, Tr } from '@patternfly/react-table';

import { ColumnConfig } from './types';

export type KubevirtTableProps<TData> = {
  ariaLabel: string;
  columns: ColumnConfig<TData>[];
  data: TData[];
  dataTest?: string;
  getRowId?: (row: TData, index: number) => string;
  loaded?: boolean;
  loadError?: unknown;
  noFilteredDataEmptyMsg?: string;
  unfilteredData?: TData[];
};

const KubevirtTable = <TData,>({
  ariaLabel,
  columns,
  data,
  dataTest,
  getRowId,
  noFilteredDataEmptyMsg,
  unfilteredData,
}: KubevirtTableProps<TData>): ReactElement => {
  const [activeSortIndex, setActiveSortIndex] = useState<number | null>(null);
  const [activeSortDirection, setActiveSortDirection] = useState<SortByDirection>(
    SortByDirection.asc,
  );

  const onSort = useCallback(
    (_event: React.MouseEvent, index: number, direction: SortByDirection) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    [],
  );

  const getSortParams = useCallback(
    (columnIndex: number): ThProps['sort'] | undefined => {
      if (!columns[columnIndex]?.sortable) return undefined;
      return {
        columnIndex,
        onSort,
        sortBy: {
          defaultDirection: SortByDirection.asc,
          direction: activeSortIndex === columnIndex ? activeSortDirection : undefined,
          index: activeSortIndex ?? undefined,
        },
      };
    },
    [columns, activeSortIndex, activeSortDirection, onSort],
  );

  const sortedData = useMemo(() => {
    if (activeSortIndex === null) return data;
    const col = columns[activeSortIndex];
    if (!col) return data;

    if (col.sort) {
      return col.sort([...data], activeSortDirection);
    }

    const { getValue } = col;
    if (!getValue) return data;

    return [...data].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal ?? '').localeCompare(String(bVal ?? ''));
      return activeSortDirection === SortByDirection.asc ? cmp : -cmp;
    });
  }, [data, columns, activeSortIndex, activeSortDirection]);

  const isFilteredEmpty = data?.length === 0 && (unfilteredData?.length ?? 0) > 0;

  return (
    <div data-test={dataTest}>
      <Table aria-label={ariaLabel}>
        <Thead>
          <Tr>
            {columns.map((col, index) => (
              <Th
                className={col.props?.className as string}
                key={col.key}
                sort={getSortParams(index)}
              >
                {col.label}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {isFilteredEmpty && noFilteredDataEmptyMsg ? (
            <Tr>
              <Td
                className="pf-v6-u-text-align-center pf-v6-u-text-color-subtle"
                colSpan={columns.length}
              >
                {noFilteredDataEmptyMsg}
              </Td>
            </Tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <Tr key={getRowId?.(row, rowIndex) ?? rowIndex}>
                {columns.map((col) => (
                  <Td className={col.props?.className as string} key={col.key}>
                    {col.renderCell(row)}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </div>
  );
};

export default KubevirtTable;
