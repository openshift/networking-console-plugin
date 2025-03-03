import React, { FC, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';

import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import {
  ActionGroup,
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormSection,
  Grid,
  PageSection,
  TextInput,
} from '@patternfly/react-core';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import { ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '@utils/constants';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import { resourcePathFromModel } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';

import ClusterUserDefinedNetworkNamespaceSelector from './components/CUDNNamespaceSelector';
import UserDefinedNetworkLayerParameters from './components/UDNLayerParameters';
import UserDefinedNetworkTopologySelect from './components/UDNTopologySelect';
import { UserDefinedNetworkFormInput } from './utils/types';
import { createUDN, fromDataToUDNObj, fromUDNObjToFormData } from './utils/utils';

type UserDefinedNetworkFormProps = {
  formData: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
  onChange: (newFormData: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind) => void;
};

const UserDefinedNetworkForm: FC<UserDefinedNetworkFormProps> = ({ formData, onChange }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [apiError, setError] = useState<Error>(null);
  const [activeNamespace] = useActiveNamespace();

  const isCluster = formData.kind === 'ClusterUserDefinedNetwork';
  let namespace = null;
  if (!isCluster) {
    namespace = ALL_NAMESPACES_KEY === activeNamespace ? DEFAULT_NAMESPACE : activeNamespace;
  }

  const methods = useForm<UserDefinedNetworkFormInput>({
    defaultValues: fromUDNObjToFormData(formData),
  });

  const {
    formState: { isSubmitting, isValid },
    handleSubmit,
    register,
    watch,
  } = methods;

  const formInput = watch();

  useEffect(() => {
    onChange(fromDataToUDNObj(formInput, namespace));
  }, [onChange, formInput, namespace]);

  const onSubmit = (data: UserDefinedNetworkFormInput) => {
    createUDN(data, namespace)
      .then(() => {
        navigate(
          resourcePathFromModel(
            isCluster ? ClusterUserDefinedNetworkModel : UserDefinedNetworkModel,
            data?.name,
            namespace,
          ),
        );
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
                    'Networks are not project-bound. Using the same name creates a shared UDN.',
                  )}
                />
              }
            >
              <TextInput {...register('name', { required: true })} />
            </FormGroup>
            <FormGroup fieldId="description" label={t('Description')}>
              <TextInput {...register('description')} />
            </FormGroup>
            {isCluster && <ClusterUserDefinedNetworkNamespaceSelector />}
            <FormSection title={t('Network')} titleElement="h2">
              <UserDefinedNetworkTopologySelect />
              <UserDefinedNetworkLayerParameters />
            </FormSection>
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

export default UserDefinedNetworkForm;
