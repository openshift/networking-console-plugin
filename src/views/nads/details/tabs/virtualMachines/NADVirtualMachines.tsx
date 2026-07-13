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
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getName } from '@utils/resources/shared';

import useNADVirtualMachines, { NADVirtualMachine } from '../../hooks/useNADVirtualMachines';

import AddNADVirtualMachinesModal from './components/AddNADVirtualMachinesModal';
import NADVirtualMachineRowActions from './components/NADVirtualMachineRowActions';

type NADVirtualMachineFilters = {
  name?: string;
};

const DEFAULT_PER_PAGE = 20;

const NADVirtualMachines: FC<{ obj?: NetworkAttachmentDefinitionKind }> = ({ obj: nad }) => {
  const { t } = useNetworkingTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { appliedColumns, applyColumns, resetColumns } = useVMNetworkTableColumns();

  const { availableVirtualMachines, loaded, loadError, virtualMachines } =
    useNADVirtualMachines(nad);
  const {
    loaded: resourcesLoaded,
    loadError: resourcesLoadError,
    lookups: vmResourceLookups,
  } = useVMResourceLookups();

  const { clearAllFilters, filters, onSetFilters } = useDataViewFilters<NADVirtualMachineFilters>({
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
      [(item: NADVirtualMachine) => getVMNetworkTableSortValue(item, sortBy, vmResourceLookups)],
      [direction === 'desc' ? 'desc' : 'asc'],
    );
  }, [direction, filteredData, sortBy, vmResourceLookups]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [page, perPage, sortedData]);

  const renderActions = useCallback(
    ({ interfaceName, vm }: NADVirtualMachine) =>
      nad ? <NADVirtualMachineRowActions interfaceName={interfaceName} nad={nad} vm={vm} /> : null,
    [nad],
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
                        ouiaId="nad-vm-column-management"
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
      {nad && (
        <AddNADVirtualMachinesModal
          availableVMs={availableVirtualMachines}
          isOpen={isAddModalOpen}
          loaded={loaded}
          nad={nad}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </PageSection>
  );
};

export default NADVirtualMachines;
