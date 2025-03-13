import React, { FC, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';

import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import {
  ActionGroup,
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Grid,
  PageSection,
  TextInput,
} from '@patternfly/react-core';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import { ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '@utils/constants';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { resourcePathFromModel } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';

import NetworkAttachmentDefinitionTypeSelect from './components/NADTypeSelect/NetworkAttachmentDefinitionTypeSelect';
import NetworkTypeParameters from './components/NetworkTypeParameters/NetworkTypeParameters';
import { NetworkAttachmentDefinitionFormInput } from './utils/types';
import { createNetAttachDef, fromDataToNADObj, fromNADObjToFormData } from './utils/utils';

type NetworkAttachmentDefinitionFormProps = {
  formData: NetworkAttachmentDefinitionKind;
  onChange: (newFormData: NetworkAttachmentDefinitionKind) => void;
};

const NetworkAttachmentDefinitionForm: FC<NetworkAttachmentDefinitionFormProps> = ({
  formData,
  onChange,
}) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [apiError, setError] = useState<Error>(null);
  const [activeNamespace] = useActiveNamespace();
  const namespace = ALL_NAMESPACES_KEY === activeNamespace ? DEFAULT_NAMESPACE : activeNamespace;

  const methods = useForm<NetworkAttachmentDefinitionFormInput>({
    defaultValues: fromNADObjToFormData(formData),
  });

  const {
    formState: { isSubmitting, isValid },
    handleSubmit,
    register,
    watch,
  } = methods;

  const formInput = watch();

  useEffect(() => {
    onChange(fromDataToNADObj(formInput, namespace));
  }, [onChange, formInput, namespace]);

  const onSubmit = (data: NetworkAttachmentDefinitionFormInput) => {
    createNetAttachDef(data, namespace)
      .then(() => {
        navigate(resourcePathFromModel(NetworkAttachmentDefinitionModel, data?.name, namespace));
      })
      .catch((err) => {
        setError(err);
      });
  };

  return (
    <Grid span={6}>
      <PageSection>
        <FormProvider {...methods}>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <FormGroup
              fieldId="name"
              isRequired
              label={t('Name')}
              labelHelp={
                <PopoverHelpIcon
                  bodyContent={t(
                    'Networks are not project-bound. Using the same name creates a shared NAD.',
                  )}
                />
              }
            >
              <TextInput {...register('name', { required: true })} />
            </FormGroup>
            <FormGroup fieldId="description" label={t('Description')}>
              <TextInput {...register('description')} />
            </FormGroup>
            <NetworkAttachmentDefinitionTypeSelect />
            <NetworkTypeParameters />
            {!isEmpty(apiError) && (
              <Alert isInline title={t('Error')} variant={AlertVariant.danger}>
                {apiError?.message}
              </Alert>
            )}
            <ActionGroup>
              <Button
                id="save-changes"
                isDisabled={!isValid || isSubmitting}
                isLoading={isSubmitting}
                type="submit"
                variant={ButtonVariant.primary}
              >
                {t('Create')}
              </Button>
              <Button
                id="cancel"
                onClick={() => navigate(-1)}
                type="reset"
                variant={ButtonVariant.secondary}
              >
                {t('Cancel')}
              </Button>
            </ActionGroup>
          </Form>
        </FormProvider>
      </PageSection>
    </Grid>
  );
};

export default NetworkAttachmentDefinitionForm;
