import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import * as _ from 'lodash';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Bullseye,
  Button,
  EmptyState,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Pagination,
  Spinner,
} from '@patternfly/react-core';
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewTh,
  DataViewToolbar,
  DataViewTr,
  isDataViewTrObject,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSelection,
  useDataViewSort,
} from '@patternfly/react-data-view';
import { SearchIcon } from '@patternfly/react-icons';
import { Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getName, getNamespace } from '@utils/resources/shared';
import { getVMStatus } from '@utils/resources/vm/selectors';
import { addVMToNAD } from '@utils/resources/vm/utils';

type AddNADVirtualMachinesModalProps = {
  availableVMs: V1VirtualMachine[];
  isOpen: boolean;
  loaded: boolean;
  nad: NetworkAttachmentDefinitionKind;
  onClose: () => void;
};

type AddVMFilters = {
  name?: string;
};

const COLUMN_COUNT = 4;
const DEFAULT_PER_PAGE = 20;
const SORT_COLUMN_KEYS = ['name', 'namespace', 'status'] as const;

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

const AddNADVirtualMachinesModal: FC<AddNADVirtualMachinesModalProps> = ({
  availableVMs,
  isOpen,
  loaded,
  nad,
  onClose,
}) => {
  const { t } = useNetworkingTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { clearAllFilters, filters, onSetFilters } = useDataViewFilters<AddVMFilters>({});

  const { onPerPageSelect, onSetPage, page, perPage } = useDataViewPagination({
    page: 1,
    perPage: DEFAULT_PER_PAGE,
  });

  const { direction, onSort, sortBy } = useDataViewSort({});

  const {
    isSelected: isVMSelected,
    onSelect: onVMSelect,
    selected,
    setSelected,
  } = useDataViewSelection<V1VirtualMachine>({
    matchOption: (item, another) =>
      getName(item) === getName(another) && getNamespace(item) === getNamespace(another),
  });

  useEffect(() => {
    if (isOpen) {
      setSelected([]);
    }
    // Only reset when the modal opens; setSelected is not stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filteredData = useMemo(() => {
    const nameFilter = filters.name?.toLowerCase();

    if (!nameFilter) {
      return availableVMs;
    }

    return availableVMs.filter((vm) => getName(vm)?.toLowerCase().includes(nameFilter));
  }, [availableVMs, filters.name]);

  const sortedData = useMemo(() => {
    if (!sortBy) {
      return filteredData;
    }

    const getSortValue = (vm: V1VirtualMachine) => {
      switch (sortBy) {
        case 'name':
          return getName(vm) ?? '';
        case 'namespace':
          return getNamespace(vm) ?? '';
        case 'status':
          return getVMStatus(vm);
        default:
          return '';
      }
    };

    return _.orderBy(filteredData, [getSortValue], [direction === 'desc' ? 'desc' : 'asc']);
  }, [direction, filteredData, sortBy]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [page, perPage, sortedData]);

  const vmByRowId = useMemo(
    () =>
      new Map<string, V1VirtualMachine>(
        paginatedData.map((vm) => [`${getNamespace(vm)}/${getName(vm)}`, vm]),
      ),
    [paginatedData],
  );

  const areAllPaginatedSelected = useMemo(
    () => paginatedData.length > 0 && paginatedData.every((vm) => isVMSelected(vm)),
    [isVMSelected, paginatedData],
  );

  const areSomePaginatedSelected = useMemo(
    () => paginatedData.some((vm) => isVMSelected(vm)) && !areAllPaginatedSelected,
    [areAllPaginatedSelected, isVMSelected, paginatedData],
  );

  const vmMatches = useCallback(
    (a: V1VirtualMachine, b: V1VirtualMachine) =>
      getName(a) === getName(b) && getNamespace(a) === getNamespace(b),
    [],
  );

  const onSelectAll = useCallback(
    (_event: React.FormEvent<HTMLInputElement>, isSelecting: boolean) => {
      if (isSelecting) {
        const newSelected = [...selected];

        paginatedData.forEach((vm) => {
          if (!newSelected.some((item) => vmMatches(item, vm))) {
            newSelected.push(vm);
          }
        });
        setSelected(newSelected);
        return;
      }

      setSelected(selected.filter((item) => !paginatedData.some((vm) => vmMatches(item, vm))));
    },
    [paginatedData, selected, setSelected, vmMatches],
  );

  const isAddDisabled = isSubmitting || availableVMs.length === 0 || selected.length === 0;

  const getSortParams = useCallback(
    (columnIndex: number) => ({
      columnIndex,
      onSort: (
        event: MouseEvent | React.KeyboardEvent | React.MouseEvent,
        _index: number | string,
        newDirection: 'asc' | 'desc',
      ) => onSort(event, SORT_COLUMN_KEYS[columnIndex], newDirection),
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

  const selection = useMemo(
    () => ({
      isSelectDisabled: () => isSubmitting,
      isSelected: (row: DataViewTr) => {
        const rowId = isDataViewTrObject(row) ? row.id : undefined;
        const vm = rowId ? vmByRowId.get(rowId) : undefined;

        return vm ? isVMSelected(vm) : false;
      },
      onSelect: (isSelecting: boolean, row: DataViewTr | DataViewTr[]) => {
        const rowsToProcess = Array.isArray(row) ? row : [row];

        rowsToProcess.forEach((item) => {
          const rowId = isDataViewTrObject(item) ? item.id : undefined;
          const vm = rowId ? vmByRowId.get(rowId) : undefined;

          if (vm) {
            onVMSelect(isSelecting, vm);
          }
        });
      },
    }),
    [isSubmitting, isVMSelected, onVMSelect, vmByRowId],
  );

  const activeState = useMemo(() => {
    if (!loaded) {
      return 'loading';
    }

    if (filteredData.length === 0) {
      return 'empty';
    }

    return 'data';
  }, [filteredData.length, loaded]);

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
            <Td colSpan={COLUMN_COUNT}>
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
            <Td colSpan={COLUMN_COUNT}>
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

  const handleAdd = async () => {
    if (selected.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await Promise.all(selected.map((vm) => addVMToNAD(vm, nad)));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant={ModalVariant.medium}>
      <ModalHeader
        description={t('Select virtual machines to connect to this network.')}
        title={t('Add virtual machines')}
      />
      <ModalBody>
        <DataView activeState={activeState} selection={selection}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_filterKey, newValues) => onSetFilters(newValues)}
                values={filters}
              >
                <DataViewTextFilter
                  filterId="name"
                  placeholder={t('Search by name...')}
                  title={t('Name')}
                />
              </DataViewFilters>
            }
            pagination={
              <Pagination
                isCompact
                itemCount={filteredData.length}
                onPerPageSelect={onPerPageSelect}
                onSetPage={onSetPage}
                page={page}
                perPage={perPage}
                variant="top"
              />
            }
          />
          <DataViewTable
            bodyStates={bodyStates}
            columns={columns}
            headStates={headStates}
            rows={rows}
          />
        </DataView>
      </ModalBody>
      <ModalFooter>
        <Button
          isDisabled={isAddDisabled}
          isLoading={isSubmitting}
          onClick={handleAdd}
          variant="primary"
        >
          {t('Add')}
        </Button>
        <Button isDisabled={isSubmitting} onClick={onClose} variant="link">
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddNADVirtualMachinesModal;
