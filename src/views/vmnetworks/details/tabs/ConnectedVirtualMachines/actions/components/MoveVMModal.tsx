import React, { FC, useState } from 'react';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import {
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';

import { VMNetworkWithProjects } from '../types';
import { moveVMsToNewNetwork } from '../utils';

import VMNetworkSelect from './VMNetworkSelect';

export type MoveVMModalProps = {
  closeModal?: () => void;
  currentNetwork: string;
  vms: V1VirtualMachine[];
};

const MoveVMModal: FC<MoveVMModalProps> = ({ closeModal, currentNetwork, vms }) => {
  const { t } = useNetworkingTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSingleVM = vms.length === 1;

  const [newNetwork, setNewNetwork] = useState<string>();
  const [newNetworkProjects, setNewNetworkProjects] = useState<string[]>([]);

  const onSelect = ({ projectNames, vmNetworkName }: VMNetworkWithProjects) => {
    setNewNetwork(vmNetworkName);
    setNewNetworkProjects(projectNames);
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      moveVMsToNewNetwork(vms, currentNetwork, newNetwork, newNetworkProjects);
      closeModal();
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="move-vm-modal"
      isOpen
      onClose={closeModal}
      onEscapePress={closeModal}
      position="top"
      variant={ModalVariant.medium}
    >
      <ModalHeader
        title={
          isSingleVM
            ? t('Move virtual machine to another OVN localnet network?')
            : t('Move virtual machines to another OVN localnet network?')
        }
      />
      <ModalBody>
        <Form>
          <p>{t('Select the target network from the list of the available networks')}</p>
          <FormGroup fieldId="vm-network" isRequired label={t('Virtual machine network')}>
            <VMNetworkSelect
              currentNetwork={currentNetwork}
              onSelect={onSelect}
              selectedNetwork={newNetwork}
              vms={vms}
            />
          </FormGroup>
          {newNetwork && (
            <Alert
              isInline
              isPlain
              title={
                isSingleVM
                  ? t(
                      'This action will disconnect the {{vmName}} virtual machine from {{currentNetwork}} and reconnect it to {{newNetwork}}.',
                      {
                        currentNetwork,
                        newNetwork,
                        vmName: getName(vms[0]),
                      },
                    )
                  : t(
                      'This action will disconnect the {{count}} virtual machines from {{currentNetwork}} and reconnect them to {{newNetwork}}.',
                      {
                        count: vms.length,
                        currentNetwork,
                        newNetwork,
                      },
                    )
              }
              variant="warning"
            />
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button isDisabled={!newNetwork} isLoading={isSubmitting} onClick={onSubmit}>
          {isSingleVM ? t('Move virtual machine') : t('Move virtual machines')}
        </Button>
        <Button onClick={closeModal} variant={ButtonVariant.link}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MoveVMModal;
