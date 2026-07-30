import React, { useCallback, useEffect, useMemo } from 'react';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { DataViewTr, isDataViewTrObject, useDataViewSelection } from '@patternfly/react-data-view';
import { getName, getNamespace } from '@utils/resources/shared';

type UseAddUDNVMModalSelectionParams = {
  isOpen: boolean;
  isSubmitting: boolean;
  onResetError: () => void;
  paginatedData: V1VirtualMachine[];
};

const useAddUDNVMModalSelection = ({
  isOpen,
  isSubmitting,
  onResetError,
  paginatedData,
}: UseAddUDNVMModalSelectionParams) => {
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
      onResetError();
    }
    // Only reset when the modal opens; setSelected is not stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  return {
    areAllPaginatedSelected,
    areSomePaginatedSelected,
    onSelectAll,
    selected,
    selection,
  };
};

export default useAddUDNVMModalSelection;
