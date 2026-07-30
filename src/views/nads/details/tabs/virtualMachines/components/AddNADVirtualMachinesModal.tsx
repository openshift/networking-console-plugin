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
import { getName, getNamespace } from '@utils/resources/shared';
import { addVMToNAD } from '@utils/resources/vm/utils';

import useAddNADVMModalData from './hooks/useAddNADVMModalData';
import useAddNADVMModalSelection from './hooks/useAddNADVMModalSelection';
import useAddNADVMModalTable from './hooks/useAddNADVMModalTable';

type AddNADVirtualMachinesModalProps = {
  availableVMs: V1VirtualMachine[];
  isOpen: boolean;
  loaded: boolean;
  nad: NetworkAttachmentDefinitionKind;
  onClose: () => void;
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
  } = useAddNADVMModalData(availableVMs);

  const { areAllPaginatedSelected, areSomePaginatedSelected, onSelectAll, selected, selection } =
    useAddNADVMModalSelection({
      isOpen,
      isSubmitting,
      onResetError,
      paginatedData,
    });

  const { activeState, bodyStates, columns, headStates, rows } = useAddNADVMModalTable({
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
      const results = await Promise.allSettled(selected.map((vm) => addVMToNAD(vm, nad)));
      const failedNames = results.flatMap((result, index) => {
        if (result.status === 'fulfilled') {
          return [];
        }

        const name = getName(selected[index]);
        return name ? [`${getNamespace(selected[index])}/${name}`] : [];
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

export default AddNADVirtualMachinesModal;
