import React, { FC, useEffect, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom-v5-compat';

import { RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import { k8sCreate, k8sUpdate, useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import {
  Checkbox,
  Form,
  FormGroup,
  PageSection,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace, resourcePathFromModel } from '@utils/resources/shared';
import { RouteKind } from '@utils/types';
import { getValidNamespace } from '@utils/utils';

import { HOST_FIELD_ID, NAME_FIELD_ID, PATH_FIELD_ID, SECURITY_FIELD_ID } from './constants';
import RouteFormActions from './RouteFormActions';
import ServiceSelector from './ServiceSelector';
import TLSTermination from './TLSTermination';
import useIsCreationForm from './useIsCreationForm';

type RouteFormProps = {
  formData: RouteKind;
  onChange: (newFormData: RouteKind) => void;
};

const RouteForm: FC<RouteFormProps> = ({ formData, onChange: onFormChange }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [apiError, setError] = useState<Error>(null);
  const [activeNamespace] = useActiveNamespace();
  const namespace = getValidNamespace(activeNamespace);

  const isCreationForm = useIsCreationForm();

  const methods = useForm<RouteKind>({
    defaultValues: formData,
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = methods;

  const route = watch();

  useEffect(() => {
    onFormChange(route);
  }, [onFormChange, route]);

  const tls = watch('spec.tls');

  const isSecured = Boolean(tls);

  const onSubmit = (data: RouteKind) => {
    const k8sPromise = isCreationForm
      ? k8sCreate({ data, model: RouteModel })
      : k8sUpdate({ data, model: RouteModel, name: getName(data), ns: getNamespace(data) });

    k8sPromise
      .then(() => {
        navigate(resourcePathFromModel(RouteModel, data?.metadata?.name, namespace));
      })
      .catch((err) => {
        setError(err);
      });
  };

  return (
    <PageSection>
      <FormProvider {...methods}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup fieldId={NAME_FIELD_ID} isRequired label={t('Name')}>
            <TextInput
              id={NAME_FIELD_ID}
              {...register('metadata.name', { required: true })}
              isDisabled={!isCreationForm}
            />

            <FormGroupHelperText
              validated={errors?.metadata?.name ? ValidatedOptions.error : ValidatedOptions.default}
            >
              {t('A unique name for the Route within the project')}
            </FormGroupHelperText>
          </FormGroup>
          <FormGroup fieldId={HOST_FIELD_ID} label={t('Hostname')}>
            <TextInput id={HOST_FIELD_ID} {...register('spec.host', { required: false })} />
            <FormGroupHelperText
              validated={errors?.spec?.host ? ValidatedOptions.error : ValidatedOptions.default}
            >
              {t('Public hostname for the Route. If not specified, a hostname is generated.')}
            </FormGroupHelperText>
          </FormGroup>
          <FormGroup fieldId={PATH_FIELD_ID} label={t('Path')}>
            <TextInput id={PATH_FIELD_ID} {...register('spec.path', { required: false })} />
            <FormGroupHelperText
              validated={errors?.spec?.path ? ValidatedOptions.error : ValidatedOptions.default}
            >
              {t('Path that the router watches to route traffic to the service.')}
            </FormGroupHelperText>
          </FormGroup>
          <ServiceSelector namespace={namespace} />

          <FormGroup fieldId={SECURITY_FIELD_ID} label={t('Security')}>
            <Controller
              control={control}
              name={'spec.tls'}
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  id={SECURITY_FIELD_ID}
                  isChecked={value !== null && value !== undefined}
                  label={t('Secure Route')}
                  onChange={(event, checked) => onChange(checked ? {} : null)}
                />
              )}
            />
            <FormGroupHelperText
              validated={errors?.spec?.tls ? ValidatedOptions.error : ValidatedOptions.default}
            >
              {t(
                'Routes can be secured using several TLS termination types for serving certificates.',
              )}
            </FormGroupHelperText>
          </FormGroup>

          {isSecured && <TLSTermination />}

          <RouteFormActions apiError={apiError} isCreationForm={isCreationForm} />
        </Form>
      </FormProvider>
    </PageSection>
  );
};

export default RouteForm;
