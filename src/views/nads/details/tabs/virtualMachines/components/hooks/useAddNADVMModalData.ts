import { useMemo } from 'react';
import { orderBy } from 'lodash';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import {
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
} from '@patternfly/react-data-view';
import { getName, getNamespace } from '@utils/resources/shared';
import { getVMStatus } from '@utils/resources/vm/selectors';

import { DEFAULT_PER_PAGE } from '../../constants';

type AddVMFilters = {
  name?: string;
};

const useAddNADVMModalData = (availableVMs: V1VirtualMachine[]) => {
  const { clearAllFilters, filters, onSetFilters } = useDataViewFilters<AddVMFilters>({});

  const { onPerPageSelect, onSetPage, page, perPage } = useDataViewPagination({
    page: 1,
    perPage: DEFAULT_PER_PAGE,
  });

  const { direction, onSort, sortBy } = useDataViewSort({});

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

    return orderBy(filteredData, [getSortValue], [direction === 'desc' ? 'desc' : 'asc']);
  }, [direction, filteredData, sortBy]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [page, perPage, sortedData]);

  return {
    clearAllFilters,
    direction,
    filteredData,
    filters,
    onPerPageSelect,
    onSetFilters,
    onSetPage,
    onSort,
    page,
    paginatedData,
    perPage,
    sortBy,
  };
};

export default useAddNADVMModalData;
