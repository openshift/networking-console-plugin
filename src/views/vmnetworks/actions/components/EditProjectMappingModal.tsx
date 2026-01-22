import React, { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { k8sUpdate } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, Form, FormGroup, ModalVariant } from '@patternfly/react-core';
import BaseModal from '@utils/components/BaseModal/BaseModal';
import ErrorAlert from '@utils/components/ErrorAlert';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import ProjectMapping from '@views/vmnetworks/form/components/ProjectMapping';
import { VMNetworkForm } from '@views/vmnetworks/form/constants';
import { isValidProjectMapping } from '@views/vmnetworks/utils';

import { getDefaultProjectMappingOption } from '../utils/utils';

export type EditProjectMappingModalProps = {
  closeModal?: () => void;
  obj: ClusterUserDefinedNetworkKind;
};

const EditProjectMappingModal: FC<EditProjectMappingModalProps> = ({ closeModal, obj }) => {
  const { t } = useNetworkingTranslation();
  const [apiError, setError] = useState<Error>(null);

  const methods = useForm<VMNetworkForm>({
    defaultValues: {
      network: obj,
      projectMappingOption: getDefaultProjectMappingOption(obj?.spec?.namespaceSelector),
    },
  });

  const {
    formState: { isSubmitting },
    handleSubmit,
    watch,
  } = methods;

  const namespaceSelector = watch('network.spec.namespaceSelector');
  const projectMappingOption = watch('projectMappingOption');

  const isSubmitDisabled =
    isSubmitting || !isValidProjectMapping(projectMappingOption, namespaceSelector);

  const onSubmit = async (data: VMNetworkForm) => {
    try {
      await k8sUpdate({
        data: data.network,
        model: ClusterUserDefinedNetworkModel,
      });
      closeModal();
    } catch (error) {
      setError(error);
    }
  };

  return (
    <BaseModal
      closeModal={closeModal}
      description={t('Use the list of projects or the labels to specify qualifying projects.')}
      executeFn={handleSubmit(onSubmit)}
      id="edit-project-mapping-modal"
      isSubmitDisabled={isSubmitDisabled}
      modalVariant={ModalVariant.small}
      submitButtonText={t('Save')}
      title={t('Edit projects mapping')}
    >
      <FormProvider {...methods}>
        <Form id="edit-project-mapping-form">
          <Alert
            isInline
            title={t(
              'VirtualMachines in projects that are no longer enrolled will lose connectivity',
            )}
            variant="warning"
          />
          <ProjectMapping isEditModal />
          {apiError && (
            <FormGroup>
              <ErrorAlert error={apiError} />
            </FormGroup>
          )}
        </Form>
      </FormProvider>
    </BaseModal>
  );
};

export default EditProjectMappingModal;
