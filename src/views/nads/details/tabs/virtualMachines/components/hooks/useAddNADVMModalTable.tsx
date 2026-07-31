import React, { useCallback, useMemo } from 'react';
import { TFunction } from 'i18next';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, EmptyState, Label, Spinner } from '@patternfly/react-core';
import { DataViewTh } from '@patternfly/react-data-view';
import { SearchIcon } from '@patternfly/react-icons';
import { Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { getName, getNamespace } from '@utils/resources/shared';
import { getVMStatus } from '@utils/resources/vm/selectors';

import { ADD_VM_MODAL_COLUMN_COUNT, ADD_VM_MODAL_SORT_COLUMN_KEYS } from '../../constants';
import { getVMStatusLabelColor } from '../../utils';

type UseAddNADVMModalTableParams = {
  areAllPaginatedSelected: boolean;
  areSomePaginatedSelected: boolean;
  direction: 'asc' | 'desc' | undefined;
  filteredDataLength: number;
  isSubmitting: boolean;
  loaded: boolean;
  onSelectAll: (event: React.FormEvent<HTMLInputElement>, isSelecting: boolean) => void;
  onSort: (
    event: MouseEvent | React.KeyboardEvent | React.MouseEvent,
    key: string,
    direction: 'asc' | 'desc',
  ) => void;
  paginatedData: V1VirtualMachine[];
  t: TFunction;
};

const useAddNADVMModalTable = ({
  areAllPaginatedSelected,
  areSomePaginatedSelected,
  direction,
  filteredDataLength,
  isSubmitting,
  loaded,
  onSelectAll,
  onSort,
  paginatedData,
  t,
}: UseAddNADVMModalTableParams) => {
  const getSortParams = useCallback(
    (columnIndex: number) => ({
      columnIndex,
      onSort: (
        event: MouseEvent | React.KeyboardEvent | React.MouseEvent,
        _index: number | string,
        newDirection: 'asc' | 'desc',
      ) => onSort(event, ADD_VM_MODAL_SORT_COLUMN_KEYS[columnIndex], newDirection),
      sortBy: { direction, index: columnIndex },
    }),
    [direction, onSort],
  );

  const columns = useMemo(
    () => [
      {
        cell: (
          <DataViewTh
            content={t('Name')}
            thProps={{
              sort: getSortParams(0),
            }}
          />
        ),
      },
      {
        cell: (
          <DataViewTh
            content={t('Namespace')}
            thProps={{
              sort: getSortParams(1),
            }}
          />
        ),
      },
      {
        cell: (
          <DataViewTh
            content={t('Status')}
            thProps={{
              sort: getSortParams(2),
            }}
          />
        ),
      },
    ],
    [getSortParams, t],
  );

  const rows = useMemo(
    () =>
      paginatedData.map((vm) => {
        const name = getName(vm);
        const vmNamespace = getNamespace(vm);
        const status = getVMStatus(vm);
        const rowId = `${vmNamespace}/${name}`;

        return {
          id: rowId,
          row: [
            {
              cell: (
                <ResourceLink
                  groupVersionKind={modelToGroupVersionKind(VirtualMachineModel)}
                  name={name}
                  namespace={vmNamespace}
                />
              ),
            },
            {
              cell: <ResourceLink kind="Namespace" name={vmNamespace} />,
            },
            {
              cell: (
                <Label color={getVMStatusLabelColor(status)} isCompact>
                  {status || '-'}
                </Label>
              ),
            },
          ],
        };
      }),
    [paginatedData],
  );

  const activeState = useMemo(() => {
    if (!loaded) {
      return 'loading';
    }

    if (filteredDataLength === 0) {
      return 'empty';
    }

    return 'data';
  }, [filteredDataLength, loaded]);

  const headStates = useMemo(
    () => ({
      data: (
        <Thead>
          <Tr>
            <Th
              aria-label={t('Select all')}
              select={{
                isHeaderSelectDisabled: isSubmitting || paginatedData.length === 0,
                isIndeterminate: areSomePaginatedSelected,
                isSelected: areAllPaginatedSelected,
                onSelect: onSelectAll,
              }}
            />
            {columns.map((column, index) => (
              <React.Fragment key={index}>{column.cell}</React.Fragment>
            ))}
          </Tr>
        </Thead>
      ),
      empty: <></>,
    }),
    [
      areAllPaginatedSelected,
      areSomePaginatedSelected,
      columns,
      isSubmitting,
      onSelectAll,
      paginatedData.length,
      t,
    ],
  );

  const bodyStates = useMemo(
    () => ({
      empty: (
        <Tbody>
          <Tr>
            <Td colSpan={ADD_VM_MODAL_COLUMN_COUNT}>
              <EmptyState
                headingLevel="h4"
                icon={SearchIcon}
                titleText={t('No virtual machines found')}
              />
            </Td>
          </Tr>
        </Tbody>
      ),
      loading: (
        <Tbody>
          <Tr>
            <Td colSpan={ADD_VM_MODAL_COLUMN_COUNT}>
              <Bullseye>
                <Spinner size="lg" />
              </Bullseye>
            </Td>
          </Tr>
        </Tbody>
      ),
    }),
    [t],
  );

  return {
    activeState,
    bodyStates,
    columns,
    headStates,
    rows,
  };
};

export default useAddNADVMModalTable;
