import React, { FC, useCallback, useState } from 'react';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import {
  Alert,
  AlertVariant,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Pagination,
} from '@patternfly/react-core';
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
} from '@patternfly/react-data-view';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getName } from '@utils/resources/shared';
import { addVMToNAD } from '@utils/resources/vm/utils';
import { networkConsole } from '@utils/utils/helpers';

import useAddUDNVMModalData from './hooks/useAddUDNVMModalData';
import useAddUDNVMModalSelection from './hooks/useAddUDNVMModalSelection';
import useAddUDNVMModalTable from './hooks/useAddUDNVMModalTable';

type AddUDNVirtualMachinesModalProps = {
  availableVMs: V1VirtualMachine[];
  getNADForVM: (vm: V1VirtualMachine) => NetworkAttachmentDefinitionKind | undefined;
  isOpen: boolean;
  loaded: boolean;
  onClose: () => void;
};

const AddUDNVirtualMachinesModal: FC<AddUDNVirtualMachinesModalProps> = ({
  availableVMs,
  getNADForVM,
  isOpen,
  loaded,
  onClose,
}) => {
  const { t } = useNetworkingTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onResetError = useCallback(() => setErrorMessage(''), []);

  const {
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
  } = useAddUDNVMModalData(availableVMs);

  const { areAllPaginatedSelected, areSomePaginatedSelected, onSelectAll, selected, selection } =
    useAddUDNVMModalSelection({
      isOpen,
      isSubmitting,
      onResetError,
      paginatedData,
    });

  const { activeState, bodyStates, columns, headStates, rows } = useAddUDNVMModalTable({
    areAllPaginatedSelected,
    areSomePaginatedSelected,
    direction,
    filteredDataLength: filteredData.length,
    isSubmitting,
    loaded,
    onSelectAll,
    onSort,
    paginatedData,
    t,
  });

  const isAddDisabled = isSubmitting || availableVMs.length === 0 || selected.length === 0;

  const handleAdd = async () => {
    if (selected.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const results = await Promise.allSettled(
        selected.map((vm) => {
          const nad = getNADForVM(vm);

          if (!nad) {
            networkConsole.warn('Failed to add virtual machine to network: NAD not found', vm);
            return Promise.reject(new Error('Network attachment definition not found'));
          }

          return addVMToNAD(vm, nad);
        }),
      );

      const failedNames = results.flatMap((result, index) => {
        if (result.status === 'fulfilled') {
          return [];
        }

        networkConsole.warn(
          'Failed to add virtual machine to network',
          selected[index],
          result.reason,
        );

        const name = getName(selected[index]);
        return name ? [name] : [];
      });

      if (failedNames.length > 0) {
        setErrorMessage(
          t('Failed to add the following virtual machines: {{names}}', {
            names: failedNames.join(', '),
          }),
        );
        return;
      }

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
        {errorMessage && (
          <Alert isInline title={t('An error occurred.')} variant={AlertVariant.danger}>
            {errorMessage}
          </Alert>
        )}
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

export default AddUDNVirtualMachinesModal;
