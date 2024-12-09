import React, { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';

import { ProjectModel, ProjectRequestModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  k8sCreate,
  k8sDelete,
  k8sPatch,
  K8sResourceCommon,
  Operator,
} from '@openshift-console/dynamic-plugin-sdk';
import { Button, ButtonVariant, Modal, ModalVariant } from '@patternfly/react-core';
import ExternalLink from '@utils/components/ExternalLink/ExternalLink';
import { documentationURLs, getDocumentationURL, isManaged } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import { getName, getResourceURL } from '@utils/resources/shared';
import { PROJECT_LABEL_FOR_MATCH_EXPRESSION } from '@utils/resources/udns/constants';

import CreateProjectModalForm from './components/CreateProjectModalForm';
import { initialFormState } from './constants';
import { CreateProjectModalFormState, NETWORK_TYPE } from './types';

import './CreateProjectModal.scss';

const CreateProjectModal: FC<{
  closeModal: () => void;
  onSubmit: (project: K8sResourceCommon) => void;
}> = ({ closeModal, onSubmit }) => {
  const { t } = useNetworkingTranslation();
  const projectsURL = getDocumentationURL(documentationURLs.workingWithProjects);

  const navigate = useNavigate();

  const methods = useForm<CreateProjectModalFormState>({
    defaultValues: initialFormState,
    mode: 'all',
  });

  const {
    formState: { isSubmitting, isValid },
    handleSubmit,
  } = methods;

  const [errorMessage, setErrorMessage] = useState('');

  const create = async (formData: CreateProjectModalFormState) => {
    const { clusterUDN, networkType, project, udn } = formData;

    try {
      const projectCreated = await k8sCreate({ data: project, model: ProjectRequestModel });

      if (networkType === NETWORK_TYPE.UDN)
        await k8sCreate({ data: udn, model: UserDefinedNetworkModel }).catch((err) => {
          k8sDelete({ model: ProjectModel, resource: projectCreated });
          throw err;
        });

      if (networkType === NETWORK_TYPE.CLUSTER_UDN) {
        await k8sPatch({
          data: [
            { op: 'add', path: '/spec/namespaceSelector/matchExpressions', value: [] },
            {
              op: 'add',
              path: '/spec/namespaceSelector/matchExpressions',
              value: [
                {
                  key: PROJECT_LABEL_FOR_MATCH_EXPRESSION,
                  operator: Operator.Equals,
                  values: [getName(projectCreated)],
                },
              ],
            },
          ],
          model: ClusterUserDefinedNetworkModel,
          resource: clusterUDN,
        });
      }

      closeModal();
      navigate(getResourceURL({ model: ProjectModel, resource: projectCreated }));

      if (onSubmit) {
        onSubmit(projectCreated);
      }
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.message || t('An error occurred. Please try again.'));
    }
  };

  return (
    <Modal
      actions={[
        <Button
          data-test="modal-create-project"
          form="create-project-modal-form"
          id="modal-create-project"
          isDisabled={isSubmitting || !isValid}
          isLoading={isSubmitting}
          key="submit"
          type="submit"
          variant={ButtonVariant.primary}
        >
          {t('Create')}
        </Button>,
        <Button
          data-test-id="modal-create-project"
          isDisabled={isSubmitting}
          key="button"
          onClick={closeModal}
          type="button"
          variant={ButtonVariant.secondary}
        >
          {t('Cancel')}
        </Button>,
      ]}
      isOpen
      onClose={closeModal}
      title={t('Create Project')}
      variant={ModalVariant.medium}
    >
      <p>{t('An OpenShift project is an alternative representation of a Kubernetes namespace.')}</p>
      {!isManaged() && (
        <p>
          <ExternalLink href={projectsURL}>
            {t('Learn more about working with projects')}
          </ExternalLink>
        </p>
      )}

      <FormProvider {...methods}>
        <CreateProjectModalForm errorMessage={errorMessage} onSubmit={handleSubmit(create)} />
      </FormProvider>
    </Modal>
  );
};

export default CreateProjectModal;
