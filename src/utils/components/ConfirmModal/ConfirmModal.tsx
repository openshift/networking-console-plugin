import React, { FC } from 'react';

import { Button, ButtonVariant, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import '@styles/modal-action.scss';

export type ConfirmModalProps = {
  btnText: JSX.Element | string;
  closeModal?: () => void;
  executeFn: () => void;
  message: JSX.Element | string;
  title: string;
};

const ConfirmModal: FC<ConfirmModalProps> = ({
  btnText,
  closeModal,
  executeFn,
  message,
  title,
}) => {
  const { t } = useNetworkingTranslation();

  const submit = () => {
    executeFn();
    closeModal();
  };

  return (
    <Modal
      className="networking-modal"
      id="confirm-modal"
      isOpen
      onClose={closeModal}
      position={'top'}
      variant={ModalVariant.small}
    >
      <ModalHeader title={title} titleIconVariant="warning" />
      <ModalBody>{message}</ModalBody>
      <ModalFooter>
        <Button onClick={submit} variant={ButtonVariant.primary}>
          {btnText || t('Confirm')}
        </Button>
        <Button onClick={closeModal} variant={ButtonVariant.link}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmModal;
