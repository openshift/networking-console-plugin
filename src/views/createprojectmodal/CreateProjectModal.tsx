import React, { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';

import { ProjectModel, ProjectRequestModel } from '@kubevirt-ui/kubevirt-api/console';
import { k8sCreate, k8sDelete, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormAlert,
  Modal,
  ModalVariant,
  Tab,
  Tabs,
  TabTitleText,
} from '@patternfly/react-core';
import ExternalLink from '@utils/components/ExternalLink/ExternalLink';
import { documentationURLs, getDocumentationURL, isManaged } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { UserDefinedNetworkModel } from '@utils/models';
import { getResourceURL } from '@utils/resources/shared';

import DetailsProjectTab from './components/DetailsProjectTab';
import NetworkTab from './components/NetworkTab';
import { CreateProjectModalFormState, initialFormState } from './constants';

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
    watch,
  } = methods;

  const project = watch('project');
  const udn = watch('udn');
  const createUDN = watch('createUDN');

  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  const create = async () => {
    try {
      const projectCreated = await k8sCreate({ data: project, model: ProjectRequestModel });

      if (createUDN)
        await k8sCreate({ data: udn, model: UserDefinedNetworkModel }).catch((err) => {
          k8sDelete({ model: ProjectModel, resource: projectCreated });
          throw err;
        });

      closeModal();

      if (onSubmit) {
        onSubmit(projectCreated);
      } else {
        navigate(getResourceURL({ model: ProjectModel, resource: projectCreated }));
      }

      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message || t('An error occurred. Please try again.'));
      // eslint-disable-next-line no-console
      console.error(`Failed to create Project:`, error);
    }
  };

  return (
    <Modal
      actions={[
        <Button
          data-test="confirm-action"
          form="create-project-modal-form"
          id="confirm-action"
          isDisabled={isSubmitting || !isValid}
          isLoading={isSubmitting}
          key="submit"
          type="submit"
          variant={ButtonVariant.primary}
        >
          {t('Create')}
        </Button>,
        <Button
          data-test-id="modal-cancel-action"
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
        <Form id="create-project-modal-form" onSubmit={handleSubmit(create)}>
          <div className="create-project-modal__tabs-container">
            <Tabs
              activeKey={selectedTab}
              className="create-project-modal__tabs"
              isBox
              isVertical
              onSelect={(_, newTab) => setSelectedTab(newTab as number)}
              role="region"
            >
              <Tab
                className="create-project-modal__tabs-content"
                eventKey={0}
                title={
                  <TabTitleText aria-label="vertical" role="region">
                    {t('Details')}
                  </TabTitleText>
                }
              >
                <DetailsProjectTab />
              </Tab>
              <Tab
                className="create-project-modal__tabs-content"
                eventKey={1}
                title={<TabTitleText>{t('Network')}</TabTitleText>}
              >
                <NetworkTab />
              </Tab>
            </Tabs>
          </div>
          {errorMessage && (
            <FormAlert>
              <Alert
                data-test="alert-error"
                isInline
                title={t('An error occurred.')}
                variant="danger"
              >
                {errorMessage}
              </Alert>
            </FormAlert>
          )}
        </Form>
      </FormProvider>
    </Modal>
  );
};

export default CreateProjectModal;
