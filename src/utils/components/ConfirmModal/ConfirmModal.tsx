import React, { FC } from 'react';

import { ActionList, ActionListItem, Button, ButtonVariant } from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
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
      className="ocs-modal networking-modal"
      footer={
        <ActionList className="tabmodal-footer">
          <ActionListItem>
            <Button onClick={submit} variant={ButtonVariant.primary}>
              {btnText || t('Confirm')}
            </Button>
          </ActionListItem>
          <ActionListItem>
            <Button onClick={closeModal} variant="link">
              {t('Cancel')}
            </Button>
          </ActionListItem>
        </ActionList>
      }
      id="confirm-modal"
      isOpen
      onClose={closeModal}
      position={'top'}
      title={title}
      titleIconVariant="warning"
      variant={ModalVariant.small}
    >
      {message}
    </Modal>
  );
};

export default ConfirmModal;
