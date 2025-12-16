import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { k8sDelete } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

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
      <ModalHeader title={t('Delete VirtualMachine network?')} titleIconVariant={'warning'} />
      <ModalBody>
        {t('Are you sure you want to delete')} <strong>{name}</strong>?
      </ModalBody>
      <ModalFooter>
        <Button isLoading={isSubmitting} onClick={onSubmit} variant={ButtonVariant.danger}>
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
