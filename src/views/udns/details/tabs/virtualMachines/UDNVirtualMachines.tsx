import React, { FC, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import * as _ from 'lodash';

import {
  Button,
  Card,
  CardBody,
  PageSection,
  Pagination,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
} from '@patternfly/react-data-view';
import useVMNetworkTableColumns from '@utils/components/VMNetworkTable/useVMNetworkTableColumns';
import VMNetworkColumnManagement from '@utils/components/VMNetworkTable/VMNetworkColumnManagement';
import {
  getVMNetworkTableSortValue,
  useVMNetworkDataViewContent,
} from '@utils/components/VMNetworkTable/vmNetworkDataViewContent';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import useVMResourceLookups from '@utils/hooks/useVMResourceLookups';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

import useUDNVirtualMachines, { UDNVirtualMachine } from '../../hooks/useUDNVirtualMachines';

import AddUDNVirtualMachinesModal from './components/AddUDNVirtualMachinesModal';
import UDNVirtualMachineRowActions from './components/UDNVirtualMachineRowActions';

type UDNVirtualMachineFilters = {
  name?: string;
};

const DEFAULT_PER_PAGE = 20;

const UDNVirtualMachines: FC<{
  obj?: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
}> = ({ obj: udn }) => {
  const { t } = useNetworkingTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { appliedColumns, applyColumns, resetColumns } = useVMNetworkTableColumns();

  const { availableVirtualMachines, getNADForVM, loaded, loadError, virtualMachines } =
    useUDNVirtualMachines(udn);
  const {
    loaded: resourcesLoaded,
    loadError: resourcesLoadError,
    lookups: vmResourceLookups,
  } = useVMResourceLookups();

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

    return _.orderBy(
      filteredData,
      [(item: UDNVirtualMachine) => getVMNetworkTableSortValue(item, sortBy, vmResourceLookups)],
      [direction === 'desc' ? 'desc' : 'asc'],
    );
  }, [direction, filteredData, sortBy, vmResourceLookups]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [page, perPage, sortedData]);

  const renderActions = useCallback(
    ({ interfaceName, vm }: UDNVirtualMachine) =>
      udn ? <UDNVirtualMachineRowActions interfaceName={interfaceName} udn={udn} vm={vm} /> : null,
    [udn],
  );

  const { bodyStates, columns, rows } = useVMNetworkDataViewContent({
    appliedColumns,
    direction,
    onSort,
    paginatedData,
    renderActions,
    sortBy,
    t,
    vmResourceLookups,
  });

  const activeState = useMemo(() => {
    if (loadError || resourcesLoadError) {
      return 'error';
    }

    if (!loaded || !resourcesLoaded) {
      return 'loading';
    }

    if (filteredData.length === 0) {
      return 'empty';
    }

    return undefined;
  }, [filteredData.length, loadError, loaded, resourcesLoadError, resourcesLoaded]);

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
                    <div className="pf-v6-u-display-flex pf-v6-u-align-items-center pf-v6-u-justify-content-flex-end pf-v6-u-gap-sm pf-v6-u-w-100">
                      <VMNetworkColumnManagement
                        appliedColumns={appliedColumns}
                        applyColumns={applyColumns}
                        onReset={resetColumns}
                        ouiaId="udn-vm-column-management"
                      />
                      <Pagination
                        isCompact
                        itemCount={filteredData.length}
                        onPerPageSelect={onPerPageSelect}
                        onSetPage={onSetPage}
                        page={page}
                        perPage={perPage}
                        variant="top"
                      />
                    </div>
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
