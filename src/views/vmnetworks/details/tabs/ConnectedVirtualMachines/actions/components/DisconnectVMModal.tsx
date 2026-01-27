import React, { FC, useState } from 'react';
import { Trans } from 'react-i18next';

import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console/modelUtils';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Popover,
  Stack,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace } from '@utils/resources/shared';

import { disconnectVMsFromNetwork } from '../utils';

export type DisconnectVMModalProps = {
  closeModal?: () => void;
  currentNetwork: string;
  vms: V1VirtualMachine[];
};

const DisconnectVMModal: FC<DisconnectVMModalProps> = ({ closeModal, currentNetwork, vms }) => {
  const { t } = useNetworkingTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSingleVM = vms.length === 1;
  const vmsCount = vms.length;

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      disconnectVMsFromNetwork(vms, currentNetwork);
      closeModal();
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="disconnect-vm-modal"
      isOpen
      onClose={closeModal}
      onEscapePress={closeModal}
      position="top"
      variant={ModalVariant.small}
    >
      <ModalHeader
        title={
          isSingleVM
            ? t('Disconnect virtual machine from this network?')
            : t('Disconnect virtual machines from this network?')
        }
        titleIconVariant={'warning'}
      />
      <ModalBody>
        {isSingleVM ? (
          <Trans t={t}>
            Are you sure you want to disconnect <strong>{getName(vms[0])}</strong> virtual machine
            from <strong>{currentNetwork}</strong> network?
          </Trans>
        ) : (
          <>
            {t('Are you sure you want to disconnect ')}
            <Popover
              bodyContent={
                <Stack hasGutter>
                  {vms.map((vm) => (
                    <ResourceLink
                      groupVersionKind={modelToGroupVersionKind(VirtualMachineModel)}
                      key={getName(vm)}
                      name={getName(vm)}
                      namespace={getNamespace(vm)}
                    />
                  ))}
                </Stack>
              }
            >
              <Button isInline variant="link">
                {vmsCount} {t('selected virtual machines')}
              </Button>
            </Popover>
            <Trans t={t}>
              {' '}
              from <strong>{currentNetwork}</strong> network?
            </Trans>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button isLoading={isSubmitting} onClick={onSubmit} variant={ButtonVariant.danger}>
          {t('Disconnect')}
        </Button>
        <Button onClick={closeModal} variant={ButtonVariant.link}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DisconnectVMModal;
