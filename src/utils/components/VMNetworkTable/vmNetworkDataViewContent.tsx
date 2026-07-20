import React, { ReactNode, useCallback, useMemo } from 'react';
import { TFunction } from 'i18next';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { ResourceLink, Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { ColumnManagementModalColumn } from '@patternfly/react-component-groups';
import { Bullseye, EmptyState, Label, Spinner } from '@patternfly/react-core';
import { DataViewTh } from '@patternfly/react-data-view';
import { Tbody, Td, Tr } from '@patternfly/react-table';
import { getName, getNamespace } from '@utils/resources/shared';
import {
  getVMConditionsSummary,
  getVMCPUCount,
  getVMDeletionProtection,
  getVMMemory,
  getVMStatus,
  VMResourceLookups,
} from '@utils/resources/vm/selectors';

import { VM_NETWORK_TABLE_COLUMN_IDS } from './constants';

export type VMNetworkTableItem = {
  interfaceName: string;
  vm: V1VirtualMachine;
};

type SortParams = {
  columnIndex: number;
  onSort: (
    event: MouseEvent | React.KeyboardEvent | React.MouseEvent,
    index: number | string,
    direction: 'asc' | 'desc',
  ) => void;
  sortBy: {
    direction: 'asc' | 'desc' | undefined;
    index: number;
  };
};

type UseVMNetworkDataViewContentParams = {
  appliedColumns: ColumnManagementModalColumn[];
  direction: 'asc' | 'desc' | undefined;
  onSort: (
    event: MouseEvent | React.KeyboardEvent | React.MouseEvent,
    columnId: string,
    direction: 'asc' | 'desc',
  ) => void;
  paginatedData: VMNetworkTableItem[];
  renderActions: (item: VMNetworkTableItem) => ReactNode;
  sortBy: string | undefined;
  t: TFunction;
  vmResourceLookups?: VMResourceLookups;
};

export const getVMNetworkTableSortValue = (
  item: VMNetworkTableItem,
  columnId: string,
  vmResourceLookups?: VMResourceLookups,
) => {
  switch (columnId) {
    case VM_NETWORK_TABLE_COLUMN_IDS.NAME:
      return getName(item.vm) ?? '';
    case VM_NETWORK_TABLE_COLUMN_IDS.NAMESPACE:
      return getNamespace(item.vm) ?? '';
    case VM_NETWORK_TABLE_COLUMN_IDS.STATUS:
      return getVMStatus(item.vm);
    case VM_NETWORK_TABLE_COLUMN_IDS.INTERFACE:
      return item.interfaceName;
    case VM_NETWORK_TABLE_COLUMN_IDS.CREATED:
      return item.vm?.metadata?.creationTimestamp ?? '';
    case VM_NETWORK_TABLE_COLUMN_IDS.MEMORY:
      return getVMMemory(item.vm, vmResourceLookups);
    case VM_NETWORK_TABLE_COLUMN_IDS.CPU:
      return getVMCPUCount(item.vm, vmResourceLookups);
    case VM_NETWORK_TABLE_COLUMN_IDS.CONDITIONS:
      return getVMConditionsSummary(item.vm);
    case VM_NETWORK_TABLE_COLUMN_IDS.DELETION_PROTECTION:
      return getVMDeletionProtection(item.vm) ? 1 : 0;
    default:
      return '';
  }
};

const getVMStatusLabelColor = (status: string) => {
  if (!status) {
    return 'grey';
  }

  if (status.includes('Error') || status === 'Stopped') {
    return 'red';
  }

  if (status === 'Running') {
    return 'green';
  }

  return 'orange';
};

const buildColumnHeader = (
  column: ColumnManagementModalColumn,
  getSortParams: (columnKey: string) => SortParams | undefined,
) => {
  const sortParams = getSortParams(column.key);

  if (!sortParams) {
    return <DataViewTh content={column.title} />;
  }

  return (
    <DataViewTh
      content={column.title}
      thProps={{
        sort: sortParams,
      }}
    />
  );
};

const buildColumnCell = (
  columnKey: string,
  item: VMNetworkTableItem,
  t: TFunction,
  vmResourceLookups?: VMResourceLookups,
): ReactNode => {
  const { interfaceName, vm } = item;
  const name = getName(vm);
  const vmNamespace = getNamespace(vm);
  const status = getVMStatus(vm);

  switch (columnKey) {
    case VM_NETWORK_TABLE_COLUMN_IDS.NAME:
      return (
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(VirtualMachineModel)}
          name={name}
          namespace={vmNamespace}
        />
      );
    case VM_NETWORK_TABLE_COLUMN_IDS.NAMESPACE:
      return <ResourceLink kind="Namespace" name={vmNamespace} />;
    case VM_NETWORK_TABLE_COLUMN_IDS.STATUS:
      return (
        <Label color={getVMStatusLabelColor(status)} isCompact>
          {status || '-'}
        </Label>
      );
    case VM_NETWORK_TABLE_COLUMN_IDS.INTERFACE:
      return interfaceName;
    case VM_NETWORK_TABLE_COLUMN_IDS.CREATED:
      return vm?.metadata?.creationTimestamp ? (
        <Timestamp timestamp={vm.metadata.creationTimestamp} />
      ) : (
        '-'
      );
    case VM_NETWORK_TABLE_COLUMN_IDS.MEMORY: {
      const memory = getVMMemory(vm, vmResourceLookups);
      return memory || '-';
    }
    case VM_NETWORK_TABLE_COLUMN_IDS.CPU: {
      const cpuCount = getVMCPUCount(vm, vmResourceLookups);
      return cpuCount ? String(cpuCount) : '-';
    }
    case VM_NETWORK_TABLE_COLUMN_IDS.CONDITIONS: {
      const conditions = getVMConditionsSummary(vm);
      return conditions || '-';
    }
    case VM_NETWORK_TABLE_COLUMN_IDS.DELETION_PROTECTION:
      return getVMDeletionProtection(vm) ? t('Enabled') : t('Disabled');
    default:
      return null;
  }
};

export const useVMNetworkDataViewContent = ({
  appliedColumns,
  direction,
  onSort,
  paginatedData,
  renderActions,
  sortBy,
  t,
  vmResourceLookups,
}: UseVMNetworkDataViewContentParams) => {
  const visibleColumns = useMemo(
    () => appliedColumns.filter((column) => column.isShown),
    [appliedColumns],
  );

  const visibleColumnKeys = useMemo(
    () => visibleColumns.map((column) => column.key),
    [visibleColumns],
  );

  const columnCount = visibleColumnKeys.length + 1;

  const getSortParams = useCallback(
    (columnKey: string): SortParams | undefined => {
      const columnIndex = visibleColumnKeys.indexOf(columnKey);

      if (columnIndex < 0) {
        return undefined;
      }

      return {
        columnIndex,
        onSort: (
          event: MouseEvent | React.KeyboardEvent | React.MouseEvent,
          _index: number | string,
          newDirection: 'asc' | 'desc',
        ) => onSort(event, columnKey, newDirection),
        sortBy: {
          direction: sortBy === columnKey ? direction : undefined,
          index: columnIndex,
        },
      };
    },
    [direction, onSort, sortBy, visibleColumnKeys],
  );

  const columns = useMemo(
    () => [
      ...visibleColumns.map((column) => ({
        cell: buildColumnHeader(column, getSortParams),
      })),
      {
        cell: <DataViewTh content={t('Actions')} />,
      },
    ],
    [getSortParams, t, visibleColumns],
  );

  const rows = useMemo(
    () =>
      paginatedData.map((item) => {
        const name = getName(item.vm);
        const vmNamespace = getNamespace(item.vm);

        return {
          id: `${vmNamespace}/${name}`,
          row: [
            ...visibleColumnKeys.map((columnKey) => ({
              cell: buildColumnCell(columnKey, item, t, vmResourceLookups),
            })),
            {
              cell: renderActions(item),
              props: { isActionCell: true },
            },
          ],
        };
      }),
    [paginatedData, renderActions, t, visibleColumnKeys, vmResourceLookups],
  );

  const bodyStates = useMemo(
    () => ({
      empty: (
        <Tbody>
          <Tr>
            <Td colSpan={columnCount}>
              <Bullseye>
                <EmptyState headingLevel="h4" titleText={t('No virtual machines found')} />
              </Bullseye>
            </Td>
          </Tr>
        </Tbody>
      ),
      error: (
        <Tbody>
          <Tr>
            <Td colSpan={columnCount}>
              <Bullseye>
                <EmptyState headingLevel="h4" titleText={t('Error loading virtual machines')} />
              </Bullseye>
            </Td>
          </Tr>
        </Tbody>
      ),
      loading: (
        <Tbody>
          <Tr>
            <Td colSpan={columnCount}>
              <Bullseye>
                <Spinner size="lg" />
              </Bullseye>
            </Td>
          </Tr>
        </Tbody>
      ),
    }),
    [columnCount, t],
  );

  return {
    bodyStates,
    columnCount,
    columns,
    rows,
  };
};
