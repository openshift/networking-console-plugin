import React, { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';

import { k8sCreate, useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import { getName, getNamespace, resourcePathFromModel } from '@utils/resources/shared';

import { UDNForm } from './constants';
import UserDefinedNetworkCreateForm from './UserDefinedNetworkCreateForm';
import { getDefaultUDN, isUDNValid } from './utils';

import './userdefinednetworkcreatemodal.scss';

type UserDefinedNetworkCreateModalProps = {
  closeModal?: () => void;
  isClusterUDN?: boolean;
};

const UserDefinedNetworkCreateModal: FC<UserDefinedNetworkCreateModalProps> = ({
  closeModal,
  isClusterUDN = false,
}) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  const [activeNamespace] = useActiveNamespace();

  const methods = useForm<UDNForm>({
    defaultValues: getDefaultUDN(isClusterUDN, activeNamespace),
    mode: 'all',
  });

  const {
    formState: { isSubmitting },
    handleSubmit,
    watch,
  } = methods;

  const [error, setIsError] = useState<Error>();
  const submit = async (udn: UDNForm) => {
    try {
      const model =
        udn.kind === ClusterUserDefinedNetworkModel.kind
          ? ClusterUserDefinedNetworkModel
          : UserDefinedNetworkModel;

      await k8sCreate({
        data: udn,
        model,
      });
      closeModal();

      navigate(resourcePathFromModel(model, getName(udn), getNamespace(udn)));
    } catch (apiError) {
      setIsError(apiError);
    }
  };

  const udn = watch();

  return (
    <Modal id="udn-create-modal" isOpen onClose={closeModal} variant={ModalVariant.small}>
      <ModalHeader
        title={t('Create {{kind}}', {
          kind: isClusterUDN ? ClusterUserDefinedNetworkModel.kind : UserDefinedNetworkModel.kind,
        })}
      />
      <ModalBody>
        <FormProvider {...methods}>
          <UserDefinedNetworkCreateForm
            isClusterUDN={isClusterUDN}
            onSubmit={handleSubmit(submit)}
          />
        </FormProvider>
      </ModalBody>
      <ModalFooter>
        <Stack hasGutter>
          {error && (
            <StackItem>
              <Alert isInline title={t('Error')} variant={AlertVariant.danger}>
                {error?.message}
              </Alert>
            </StackItem>
          )}
          <StackItem>
            <ActionList>
              <ActionListGroup>
                <ActionListItem>
                  <Button
                    data-test="create-udn-submit"
                    form="create-udn-form"
                    isDisabled={isSubmitting || !isUDNValid(udn)}
                    isLoading={isSubmitting}
                    key="submit"
                    type="submit"
                    variant={ButtonVariant.primary}
                  >
                    {t('Create')}
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button
                    data-test-id="create-udn-close"
                    isDisabled={isSubmitting}
                    key="button"
                    onClick={closeModal}
                    variant={ButtonVariant.secondary}
                  >
                    {t('Cancel')}
                  </Button>
                </ActionListItem>
              </ActionListGroup>
            </ActionList>
          </StackItem>
        </Stack>
      </ModalFooter>
    </Modal>
  );
};

export default UserDefinedNetworkCreateModal;
