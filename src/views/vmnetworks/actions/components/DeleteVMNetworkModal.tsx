import React, { FC, useState } from 'react';
import { Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';

import { k8sDelete } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  ButtonVariant,
  Checkbox,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';
import useConnectedVMs from '@views/vmnetworks/hooks/useConnectedVMs';

import { VM_NETWORKS_PATH } from '../../constants';

export type DeleteVMNetworkModalProps = {
  closeModal?: () => void;
  obj: ClusterUserDefinedNetworkKind;
};

const DeleteVMNetworkModal: FC<DeleteVMNetworkModalProps> = ({ closeModal, obj }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const name = getName(obj);

  const [connectedVMs] = useConnectedVMs(obj);
  const hasConnectedVMs = !isEmpty(connectedVMs);

  const [isChecked, setIsChecked] = useState(false);

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await k8sDelete({
        model: ClusterUserDefinedNetworkModel,
        resource: obj,
      });
      closeModal();
      navigate(VM_NETWORKS_PATH);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="delete-vm-network-modal"
      isOpen
      onClose={closeModal}
      onEscapePress={closeModal}
      position="top"
      variant={ModalVariant.small}
    >
      <ModalHeader title={t('Delete network?')} titleIconVariant={'warning'} />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('Are you sure you want to delete')} <strong>{name}</strong>?{' '}
            {hasConnectedVMs &&
              t('This network is currently connected to {{count}} virtual machine.', {
                count: connectedVMs.length,
              })}
          </StackItem>
          {hasConnectedVMs && (
            <StackItem>
              <Trans ns="plugin__networking-console-plugin" t={t}>
                <strong>Note</strong>: The network will be marked for deletion and removed after all
                connected virtual machines are disconnected.
              </Trans>
            </StackItem>
          )}
          <StackItem>
            <Checkbox
              id="delete-vm-network-modal-acknowledge-checkbox"
              isChecked={isChecked}
              label={t('I acknowledge that this action is permanent and cannot be undone.')}
              onChange={(_, checked) => setIsChecked(checked)}
            />
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          isDisabled={!isChecked}
          isLoading={isSubmitting}
          onClick={onSubmit}
          variant={ButtonVariant.danger}
        >
          {t('Delete')}
        </Button>
        <Button onClick={closeModal} variant={ButtonVariant.secondary}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteVMNetworkModal;
