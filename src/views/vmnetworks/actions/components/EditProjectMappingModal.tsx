import React, { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom-v5-compat';

import { k8sUpdate } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertVariant, Form, FormGroup, ModalVariant } from '@patternfly/react-core';
import { WarningTriangleIcon } from '@patternfly/react-icons';
import chartWarningColor from '@patternfly/react-tokens/dist/esm/chart_global_warning_Color_200';
import BaseModal from '@utils/components/BaseModal/BaseModal';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';
import ProjectMapping from '@views/vmnetworks/form/components/ProjectMapping';
import { VMNetworkForm } from '@views/vmnetworks/form/constants';

export type EditProjectMappingModalProps = {
  closeModal?: () => void;
  obj: ClusterUserDefinedNetworkKind;
};

const EditProjectMappingModal: FC<EditProjectMappingModalProps> = ({ closeModal, obj }) => {
  const { t } = useNetworkingTranslation();

  const name = getName(obj);
  const [apiError, setError] = useState<Error>(null);

  const methods = useForm<VMNetworkForm>({
    defaultValues: {
      network: obj,
      projectList: !isEmpty(obj?.spec?.namespaceSelector?.matchExpressions),
    },
  });

  const {
    formState: { isSubmitSuccessful, isSubmitting },
    handleSubmit,
  } = methods;

  const onSubmit = async (data: VMNetworkForm) => {
    try {
      await k8sUpdate({
        data: data.network,
        model: ClusterUserDefinedNetworkModel,
      });
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
      isSubmitDisabled={isSubmitting}
      modalVariant={ModalVariant.small}
      submitButtonText={t('Save')}
      title={t('Edit project mapping')}
    >
      <FormProvider {...methods}>
        <Form id="edit-project-mapping-form">
          <p>
            <WarningTriangleIcon color={chartWarningColor.value} />{' '}
            {t(
              'VirtualMachines in projects that are no longer enrolled will lose connectivity',
            )}{' '}
          </p>
          <ProjectMapping />
          {isSubmitSuccessful && isEmpty(apiError) && (
            <FormGroup>
              <Alert
                title={t("Network '{{name}}' has been created successfully.", { name })}
                variant={AlertVariant.success}
              >
                <Link to={`/k8s/cluster/virtualmachine-networks/${name}`}>{t('View network')}</Link>
              </Alert>
            </FormGroup>
          )}
        </Form>
      </FormProvider>
    </BaseModal>
  );
};

export default EditProjectMappingModal;
