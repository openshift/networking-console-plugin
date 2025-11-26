import React, { FC, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Trans } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom-v5-compat';

import { k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Wizard,
  WizardHeader,
  WizardStep,
} from '@patternfly/react-core';
import ErrorAlert from '@utils/components/ErrorAlert';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { MAX_MTU } from '@utils/constants/mtu';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import {
  VM_NETWORK_ABANDONED,
  VM_NETWORK_CREATION_FAILED,
  VM_NETWORK_CREATION_STARTED,
} from '@utils/telemetry/constants';
import {
  logCreationFailed,
  logNetworkingEvent,
  logVMNetworkCreated,
} from '@utils/telemetry/telemetry';
import { isEmpty } from '@utils/utils';

import { VM_NETWORKS_PATH } from '../constants';

import NetworkDefinition from './components/NetworkDefinition';
import ProjectMapping from './components/ProjectMapping';
import { defaultFormValue, VMNetworkForm } from './constants';

const VMNetworkNewForm: FC = () => {
  const navigate = useNavigate();
  const { t } = useNetworkingTranslation();
  const [apiError, setError] = useState<Error>(null);

  const completed = useRef(false);
  const currentStepId = useRef<number | string>('wizard-network-definition');

  useEffect(() => {
    logNetworkingEvent(VM_NETWORK_CREATION_STARTED);
  }, []);

  useEffect(() => {
    return () => {
      if (!completed.current) {
        logNetworkingEvent(VM_NETWORK_ABANDONED, { stepId: currentStepId.current });
      }
    };
  }, []);

  const methods = useForm<VMNetworkForm>({
    defaultValues: defaultFormValue,
  });

  const {
    formState: { isSubmitSuccessful, isSubmitting },
    handleSubmit,
    watch,
  } = methods;

  const name = watch('network.metadata.name');
  const bridgeMapping = watch('network.spec.network.localnet.physicalNetworkName');
  const mtu = watch('network.spec.network.localnet.mtu');
  const namespaceSelector = watch('network.spec.namespaceSelector');
  const showProjectList = watch('showProjectList');
  const matchLabelCheck = watch('matchLabelCheck');

  const isRequiredFieldsInvalid =
    isEmpty(name) || isEmpty(bridgeMapping) || isEmpty(mtu) || mtu > MAX_MTU;

  const emptyProjectList = showProjectList
    ? isEmpty(namespaceSelector.matchExpressions)
    : !matchLabelCheck && isEmpty(namespaceSelector.matchLabels);

  const onSubmit = async (data: VMNetworkForm) => {
    try {
      await k8sCreate({
        data: data.network,
        model: ClusterUserDefinedNetworkModel,
      });

      completed.current = true;
      logVMNetworkCreated(data.network, data.showProjectList);

      navigate(VM_NETWORKS_PATH);
    } catch (error) {
      completed.current = true;
      logCreationFailed(VM_NETWORK_CREATION_FAILED, error);
      setError(error);
    }
  };

  const onClose = () => navigate(VM_NETWORKS_PATH);

  return (
    <FormProvider {...methods}>
      <Wizard
        header={
          <WizardHeader
            description={
              <Trans t={t}>
                Define a Virtual Machine Network providing access to the physical underlay through a
                selected node network mapping. Learn more about{' '}
                <Link
                  rel="noreferrer"
                  target="_blank"
                  to={getDocumentationURL(documentationURLs.vmNetworking)}
                >
                  virtual machine networks
                </Link>
                .
              </Trans>
            }
            isCloseHidden
            title={t('Create Virtual Machine Network')}
          />
        }
        onSave={handleSubmit(onSubmit)}
        onStepChange={(event, currentStep) => {
          currentStepId.current = currentStep.id;
        }}
      >
        <WizardStep
          footer={{
            isNextDisabled: isRequiredFieldsInvalid,
            onClose,
          }}
          id="wizard-network-definition"
          name={t('Network definition')}
        >
          <NetworkDefinition />
        </WizardStep>
        <WizardStep
          footer={{
            isNextDisabled: isRequiredFieldsInvalid || isSubmitting || emptyProjectList,
            nextButtonProps: { isLoading: isSubmitting },
            nextButtonText: t('Create'),
            onClose,
          }}
          id="wizard-project-mapping"
          name={t('Project mapping')}
        >
          <Form>
            <ProjectMapping />
            {apiError && (
              <FormGroup>
                <ErrorAlert error={apiError} />
              </FormGroup>
            )}
            {isSubmitSuccessful && isEmpty(apiError) && (
              <FormGroup>
                <Alert
                  title={t("Network '{{name}}' has been created successfully.", { name })}
                  variant="success"
                >
                  <Button
                    isInline
                    onClick={() => {
                      navigate(`${VM_NETWORKS_PATH}/${name}`);
                      close();
                    }}
                    variant={ButtonVariant.link}
                  >
                    {t('View network')}
                  </Button>
                </Alert>
              </FormGroup>
            )}
          </Form>
        </WizardStep>
      </Wizard>
    </FormProvider>
  );
};

export default VMNetworkNewForm;
