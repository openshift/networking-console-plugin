import React, { FC, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import * as _ from 'lodash';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Bullseye,
  Button,
  Card,
  CardBody,
  EmptyState,
  Label,
  PageSection,
  Pagination,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewTh,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
} from '@patternfly/react-data-view';
import { Tbody, Td, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { getVMStatus } from '@utils/resources/vm/selectors';

import useUDNVirtualMachines, { UDNVirtualMachine } from '../../hooks/useUDNVirtualMachines';

import AddUDNVirtualMachinesModal from './components/AddUDNVirtualMachinesModal';
import UDNVirtualMachineRowActions from './components/UDNVirtualMachineRowActions';

type UDNVirtualMachineFilters = {
  name?: string;
};

const COLUMN_COUNT = 5;
const DEFAULT_PER_PAGE = 20;
const SORT_COLUMN_KEYS = ['name', 'namespace', 'status', 'interface'] as const;

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

const UDNVirtualMachines: FC<{
  obj?: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
}> = ({ obj: udn }) => {
  const { t } = useNetworkingTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { availableVirtualMachines, getNADForVM, loaded, loadError, virtualMachines } =
    useUDNVirtualMachines(udn);

  const { clearAllFilters, filters, onSetFilters } = useDataViewFilters<UDNVirtualMachineFilters>({
    searchParams,
    setSearchParams,
  });

  const { onPerPageSelect, onSetPage, page, perPage } = useDataViewPagination({
    page: 1,
    perPage: DEFAULT_PER_PAGE,
    searchParams,
    setSearchParams,
  });

  const { direction, onSort, sortBy } = useDataViewSort({
    searchParams,
    setSearchParams,
  });

  const filteredData = useMemo(() => {
    const nameFilter = filters.name?.toLowerCase();

    if (!nameFilter) {
      return virtualMachines;
    }

    return virtualMachines.filter(({ vm }) => getName(vm)?.toLowerCase().includes(nameFilter));
  }, [filters.name, virtualMachines]);

  const sortedData = useMemo(() => {
    if (!sortBy) {
      return filteredData;
    }

    const getSortValue = (item: UDNVirtualMachine) => {
      switch (sortBy) {
        case 'name':
          return getName(item.vm) ?? '';
        case 'namespace':
          return getNamespace(item.vm) ?? '';
        case 'status':
          return getVMStatus(item.vm);
        case 'interface':
          return item.interfaceName;
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
      {
        cell: (
          <DataViewTh
            content={t('Interface')}
            thProps={{
              sort: getSortParams(3),
            }}
          />
        ),
      },
      {
        cell: <DataViewTh content={t('Actions')} />,
      },
    ],
    [getSortParams, t],
  );

  const rows = useMemo(
    () =>
      paginatedData.map(({ interfaceName, vm }) => {
        const name = getName(vm);
        const vmNamespace = getNamespace(vm);
        const status = getVMStatus(vm);

        return {
          id: `${vmNamespace}/${name}`,
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
            {
              cell: interfaceName,
            },
            {
              cell: udn && (
                <UDNVirtualMachineRowActions interfaceName={interfaceName} udn={udn} vm={vm} />
              ),
              props: { isActionCell: true },
            },
          ],
        };
      }),
    [udn, paginatedData],
  );

  const activeState = useMemo(() => {
    if (loadError) {
      return 'error';
    }

    if (!loaded) {
      return 'loading';
    }

    if (filteredData.length === 0) {
      return 'empty';
    }

    return undefined;
  }, [filteredData.length, loadError, loaded]);

  const bodyStates = useMemo(
    () => ({
      empty: (
        <Tbody>
          <Tr>
            <Td colSpan={COLUMN_COUNT}>
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
            <Td colSpan={COLUMN_COUNT}>
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

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
            {t('Add virtual machines')}
          </Button>
        </StackItem>
        <StackItem>
          <Card>
            <CardBody isFilled>
              <DataView activeState={activeState}>
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
                <DataViewTable bodyStates={bodyStates} columns={columns} rows={rows} />
              </DataView>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
      {udn && (
        <AddUDNVirtualMachinesModal
          availableVMs={availableVirtualMachines}
          getNADForVM={getNADForVM}
          isOpen={isAddModalOpen}
          loaded={loaded}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </PageSection>
  );
};

export default UDNVirtualMachines;
