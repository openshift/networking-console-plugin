import React, { FC, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';

import { k8sCreate, useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import FailedToGetProjectsAlert from '@utils/components/ProjectsPrimaryUDNAlerts/FailedToGetProjectsAlert';
import NoProjectReadyForPrimaryUDNAlert from '@utils/components/ProjectsPrimaryUDNAlerts/NoProjectReadyForPrimaryUDNAlert';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import useProjectsWithPrimaryUserDefinedLabel from '@utils/hooks/useProjectsWithPrimaryUserDefinedLabel';
import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import { getName, getNamespace, resourcePathFromModel } from '@utils/resources/shared';
import {
  CUDN_CREATION_FAILED,
  CUDN_CREATION_STARTED,
  UDN_CREATION_FAILED,
  UDN_CREATION_STARTED,
} from '@utils/telemetry/constants';
import {
  logCreationFailed,
  logCUDNCreated,
  logNetworkingEvent,
  logUDNCreated,
} from '@utils/telemetry/telemetry';

import { PROJECT_NAME } from '../constants';

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

  useEffect(() => {
    const eventName = isClusterUDN ? CUDN_CREATION_STARTED : UDN_CREATION_STARTED;
    logNetworkingEvent(eventName);
  }, [isClusterUDN]);

  const [activeNamespace] = useActiveNamespace();
  const [projectsReadyForPrimaryUDN, loadedPrimaryUDN, errorLoadingPrimaryUDN] =
    useProjectsWithPrimaryUserDefinedLabel();

  const showFailedToRetrieveProjectsError =
    !isClusterUDN && loadedPrimaryUDN && errorLoadingPrimaryUDN;
  const showNoProjectReadyForPrimaryUDNError =
    !isClusterUDN &&
    !showFailedToRetrieveProjectsError &&
    loadedPrimaryUDN &&
    projectsReadyForPrimaryUDN?.length === 0;

  const methods = useForm<UDNForm>({
    defaultValues: getDefaultUDN(isClusterUDN),
    mode: 'all',
  });

  const {
    formState: { isSubmitting },
    handleSubmit,
    setValue,
    watch,
  } = methods;

  const selectedProject = watch(PROJECT_NAME);

  useEffect(() => {
    if (selectedProject || isClusterUDN) {
      return;
    }

    if (projectsReadyForPrimaryUDN.some((it) => it?.metadata?.name === activeNamespace)) {
      setValue(PROJECT_NAME, activeNamespace);
    } else if (projectsReadyForPrimaryUDN?.length === 1) {
      setValue(PROJECT_NAME, projectsReadyForPrimaryUDN[0].metadata.name);
    }
  }, [activeNamespace, selectedProject, isClusterUDN, projectsReadyForPrimaryUDN, setValue]);

  const [error, setIsError] = useState<Error>();
  const submit = async (udn: UDNForm) => {
    try {
      const model = isClusterUDN ? ClusterUserDefinedNetworkModel : UserDefinedNetworkModel;

      const createdResource = await k8sCreate({
        data: udn,
        model,
      });

      if (isClusterUDN) {
        logCUDNCreated(createdResource);
      } else {
        logUDNCreated(createdResource);
      }

      closeModal();
      navigate(resourcePathFromModel(model, getName(udn), getNamespace(udn)));
    } catch (apiError) {
      const failEvent = isClusterUDN ? CUDN_CREATION_FAILED : UDN_CREATION_FAILED;
      logCreationFailed(failEvent, apiError);
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
        {showFailedToRetrieveProjectsError && (
          <FailedToGetProjectsAlert error={errorLoadingPrimaryUDN} />
        )}
        {showNoProjectReadyForPrimaryUDNError && (
          <NoProjectReadyForPrimaryUDNAlert className="pf-v6-u-mb-md" />
        )}

        <FormProvider {...methods}>
          <UserDefinedNetworkCreateForm
            error={error}
            isClusterUDN={isClusterUDN}
            onSubmit={handleSubmit(submit)}
          />
        </FormProvider>
      </ModalBody>
      <ModalFooter>
        <Button
          data-test="create-udn-submit"
          form="create-udn-form"
          isDisabled={
            isSubmitting ||
            !isUDNValid(udn) ||
            !loadedPrimaryUDN ||
            showFailedToRetrieveProjectsError
          }
          isLoading={isSubmitting || !loadedPrimaryUDN}
          key="submit"
          type="submit"
          variant={ButtonVariant.primary}
        >
          {t('Create')}
        </Button>
        <Button
          data-test-id="create-udn-close"
          isDisabled={isSubmitting}
          key="button"
          onClick={closeModal}
          variant={ButtonVariant.link}
        >
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UserDefinedNetworkCreateModal;
