import React, { FC, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { k8sCreate, k8sUpdate } from '@openshift-console/dynamic-plugin-sdk';
import { Form, FormGroup, PageSection, TextInput, ValidatedOptions } from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { recordToLabelPairs } from '@utils/components/SelectorPreview/utils/utils';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace, resourcePathFromModel } from '@utils/resources/shared';

import useIsCreationForm from './hooks/useIsCreationForm';
import { NAME_FIELD_ID, NAMESPACE_FIELD_ID } from './utils/constants';
import { buildServiceSubmitPayload, portsToText, textToPorts } from './utils/utils';
import {
  getServiceFormFieldErrors,
  validateExternalName,
  validatePortsText,
  validateSelectorPairs,
} from './utils/validationUtils';
import ServiceFormActions from './ServiceFormActions';
import ServiceTypeFields from './ServiceTypeFields';
import ServiceTypeSelect from './ServiceTypeSelect';

type ServiceFormProps = {
  formData: IoK8sApiCoreV1Service;
  onChange: (newFormData: IoK8sApiCoreV1Service) => void;
};

const ServiceForm: FC<ServiceFormProps> = ({ formData, onChange: onFormChange }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [apiError, setError] = useState<Error>(null);
  const isCreationForm = useIsCreationForm();

  const [portsText, setPortsText] = useState(() => portsToText(formData.spec?.ports));
  const [portsError, setPortsError] = useState<string>();
  const [labelPairs, setLabelPairs] = useState(() => recordToLabelPairs(formData.spec?.selector));
  const [selectorError, setSelectorError] = useState<string>();

  const methods = useForm<IoK8sApiCoreV1Service>({
    defaultValues: formData,
    mode: 'onChange',
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = methods;

  const service = watch();
  const serviceType = watch('spec.type');
  const externalName = watch('spec.externalName');
  const namespace = watch('metadata.namespace');
  const isExternalName = serviceType === 'ExternalName';

  const isFormValid = isExternalName
    ? validateExternalName(t, externalName).isValid
    : validateSelectorPairs(t, labelPairs).isValid && !portsError;

  useEffect(() => {
    onFormChange(service);
  }, [onFormChange, service]);

  useEffect(() => {
    if (isExternalName) {
      setPortsError(undefined);
      setSelectorError(undefined);
    }
  }, [isExternalName]);

  const onLabelPairsChange = (pairs: string[][], error?: string) => {
    setLabelPairs(pairs);
    setSelectorError(error);
  };

  const onPortsChange = (text: string) => {
    setPortsText(text);
    const { errorMessage, isValid } = validatePortsText(t, text);
    setPortsError(isValid ? undefined : errorMessage);
    if (isValid) {
      setValue('spec.ports', textToPorts(text), { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmit = (data: IoK8sApiCoreV1Service) => {
    const { portsError: nextPortsError, selectorError: nextSelectorError } =
      getServiceFormFieldErrors(t, labelPairs, portsText, data.spec?.type);

    setPortsError(nextPortsError);
    setSelectorError(nextSelectorError);

    if (nextSelectorError || nextPortsError) {
      return;
    }

    const payload = buildServiceSubmitPayload(data, portsText);

    const k8sPromise = isCreationForm
      ? k8sCreate({ data: payload, model: ServiceModel })
      : k8sUpdate({
          data: payload,
          model: ServiceModel,
          name: getName(payload),
          ns: getNamespace(payload),
        });

    return k8sPromise
      .then(() => {
        navigate(resourcePathFromModel(ServiceModel, getName(payload), getNamespace(payload)));
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
              aria-invalid={Boolean(errors?.metadata?.name)}
              aria-label={t('Name')}
              id={NAME_FIELD_ID}
              isDisabled={!isCreationForm}
              validated={errors?.metadata?.name ? ValidatedOptions.error : ValidatedOptions.default}
              {...register('metadata.name', { required: t('Name is required') })}
            />
            {errors?.metadata?.name && (
              <FormGroupHelperText validated={ValidatedOptions.error}>
                {errors.metadata.name.message as string}
              </FormGroupHelperText>
            )}
          </FormGroup>

          <FormGroup fieldId={NAMESPACE_FIELD_ID} isRequired label={t('Namespace')}>
            <TextInput
              aria-invalid={Boolean(errors?.metadata?.namespace)}
              aria-label={t('Namespace')}
              id={NAMESPACE_FIELD_ID}
              isDisabled={!isCreationForm}
              validated={
                errors?.metadata?.namespace ? ValidatedOptions.error : ValidatedOptions.default
              }
              {...register('metadata.namespace', { required: t('Namespace is required') })}
            />
            {errors?.metadata?.namespace && (
              <FormGroupHelperText validated={ValidatedOptions.error}>
                {errors.metadata.namespace.message as string}
              </FormGroupHelperText>
            )}
          </FormGroup>

          <ServiceTypeSelect />

          <ServiceTypeFields
            isExternalName={isExternalName}
            labelPairs={labelPairs}
            namespace={namespace}
            onLabelPairsChange={onLabelPairsChange}
            onPortsChange={onPortsChange}
            portsError={portsError}
            portsText={portsText}
            selectorError={selectorError}
          />

          <ServiceFormActions
            apiError={apiError}
            isCreationForm={isCreationForm}
            isFormValid={isFormValid}
          />
        </Form>
      </FormProvider>
    </PageSection>
  );
};

export default ServiceForm;
