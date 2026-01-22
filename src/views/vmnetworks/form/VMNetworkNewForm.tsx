import React, { FC, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';

import { k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Wizard,
  WizardStep,
} from '@patternfly/react-core';
import ErrorAlert from '@utils/components/ErrorAlert';
import { MAX_MTU } from '@utils/constants/mtu';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import useQueryParams from '@utils/hooks/useQueryParams';
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
import { isValidProjectMapping } from '../utils';

import NetworkDefinition from './components/NetworkDefinition';
import ProjectMapping from './components/ProjectMapping';
import VMNetworkWizardHeader from './components/VMNetworkWizardHeader';
import { getDefaultFormValue, NODE_NETWORK_MAPPING_PARAM_KEY, VMNetworkForm } from './constants';

const VMNetworkNewForm: FC = () => {
  const navigate = useNavigate();
  const { t } = useNetworkingTranslation();
  const [apiError, setError] = useState<Error>(null);

  const params = useQueryParams();
  const nodeNetworkMapping = params?.[NODE_NETWORK_MAPPING_PARAM_KEY] || '';

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
    defaultValues: getDefaultFormValue(nodeNetworkMapping),
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
  const projectMappingOption = watch('projectMappingOption');

  const isRequiredFieldsInvalid =
    isEmpty(name) || isEmpty(bridgeMapping) || isEmpty(mtu) || mtu > MAX_MTU;

  const isProjectMappingInvalid = !isValidProjectMapping(projectMappingOption, namespaceSelector);

  const onSubmit = async (data: VMNetworkForm) => {
    try {
      await k8sCreate({
        data: data.network,
        model: ClusterUserDefinedNetworkModel,
      });

      completed.current = true;
      logVMNetworkCreated(data.network, data.projectMappingOption);

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
        header={<VMNetworkWizardHeader />}
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
            isNextDisabled: isRequiredFieldsInvalid || isSubmitting || isProjectMappingInvalid,
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
