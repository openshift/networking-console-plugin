import React, { FC } from 'react';

import {
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalHeaderProps,
  ModalVariant,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

export type BaseModalProps = {
  closeModal?: () => void;
  closeOnSubmit?: boolean;
  description?: React.ReactNode | string;
  executeFn: () => void;
  id?: string;
  isSubmitDisabled?: boolean;
  modalVariant: ModalVariant;
  submitButtonText: JSX.Element | string;
  title: string;
  titleIconVariant?: ModalHeaderProps['titleIconVariant'];
};

const BaseModal: FC<BaseModalProps> = ({
  children,
  closeModal,
  closeOnSubmit,
  description,
  executeFn,
  id,
  isSubmitDisabled = false,
  modalVariant = ModalVariant.small,
  submitButtonText,
  title,
  titleIconVariant,
}) => {
  const { t } = useNetworkingTranslation();

  const submit = () => {
    executeFn();

    if (closeOnSubmit) closeModal();
  };

  return (
    <Modal id={id} isOpen onClose={closeModal} position={'top'} variant={modalVariant}>
      <ModalHeader description={description} title={title} titleIconVariant={titleIconVariant} />
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        <Button isDisabled={isSubmitDisabled} onClick={submit} variant={ButtonVariant.primary}>
          {submitButtonText || t('Confirm')}
        </Button>
        <Button onClick={closeModal} variant={ButtonVariant.link}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default BaseModal;
