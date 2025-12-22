import React, { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { k8sUpdate } from '@openshift-console/dynamic-plugin-sdk';
import { Form, FormGroup, ModalVariant } from '@patternfly/react-core';
import { WarningTriangleIcon } from '@patternfly/react-icons';
import chartWarningColor from '@patternfly/react-tokens/dist/esm/chart_global_warning_Color_200';
import BaseModal from '@utils/components/BaseModal/BaseModal';
import ErrorAlert from '@utils/components/ErrorAlert';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';
import ProjectMapping from '@views/vmnetworks/form/components/ProjectMapping';
import { VMNetworkForm } from '@views/vmnetworks/form/constants';
import { isValidProjectMapping } from '@views/vmnetworks/utils';

export type EditProjectMappingModalProps = {
  closeModal?: () => void;
  obj: ClusterUserDefinedNetworkKind;
};

const EditProjectMappingModal: FC<EditProjectMappingModalProps> = ({ closeModal, obj }) => {
  const { t } = useNetworkingTranslation();
  const [apiError, setError] = useState<Error>(null);

  const methods = useForm<VMNetworkForm>({
    defaultValues: {
      matchLabelCheck: isEmpty(obj?.spec?.namespaceSelector?.matchLabels),
      network: obj,
      showProjectList: !isEmpty(obj?.spec?.namespaceSelector?.matchExpressions),
    },
  });

  const {
    formState: { isSubmitting },
    handleSubmit,
    watch,
  } = methods;

  const namespaceSelector = watch('network.spec.namespaceSelector');
  const showProjectList = watch('showProjectList');
  const matchLabelCheck = watch('matchLabelCheck');

  const isSubmitDisabled =
    isSubmitting || !isValidProjectMapping(showProjectList, matchLabelCheck, namespaceSelector);

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
      description={t(
        'You can edit your VirtualMachine network mapping. Use the list of projects or labels to specify qualifying projects.',
      )}
      executeFn={handleSubmit(onSubmit)}
      id="edit-project-mapping-modal"
      isSubmitDisabled={isSubmitDisabled}
      modalVariant={ModalVariant.small}
      submitButtonText={t('Save')}
      title={t('Edit project mapping')}
    >
      <FormProvider {...methods}>
        <Form id="edit-project-mapping-form">
          <p>
            <WarningTriangleIcon color={chartWarningColor.value} />{' '}
            {t('VirtualMachines in projects that are no longer enrolled will lose connectivity')}{' '}
          </p>
          <ProjectMapping />
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
