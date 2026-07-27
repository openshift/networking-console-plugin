import React, { FC, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { k8sCreate, k8sUpdate } from '@openshift-console/dynamic-plugin-sdk';
import {
  Form,
  FormGroup,
  PageSection,
  TextArea,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace, resourcePathFromModel } from '@utils/resources/shared';

import { NAME_FIELD_ID, NAMESPACE_FIELD_ID, PORTS_FIELD_ID, SELECTOR_FIELD_ID } from './constants';
import ServiceFormActions from './ServiceFormActions';
import ServiceTypeSelect from './ServiceTypeSelect';
import useIsCreationForm from './useIsCreationForm';
import {
  portsToText,
  selectorToText,
  textToPorts,
  textToSelector,
  validatePortsText,
  validateSelectorText,
} from './utils';

type ServiceFormProps = {
  formData: IoK8sApiCoreV1Service;
  onChange: (newFormData: IoK8sApiCoreV1Service) => void;
};

const ServiceForm: FC<ServiceFormProps> = ({ formData, onChange: onFormChange }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [apiError, setError] = useState<Error>(null);
  const isCreationForm = useIsCreationForm();

  const [selectorText, setSelectorText] = useState(() => selectorToText(formData.spec?.selector));
  const [portsText, setPortsText] = useState(() => portsToText(formData.spec?.ports));
  const [selectorError, setSelectorError] = useState<string>();
  const [portsError, setPortsError] = useState<string>();

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

  useEffect(() => {
    onFormChange(service);
  }, [onFormChange, service]);

  const onSelectorChange = (text: string) => {
    setSelectorText(text);
    const validation = validateSelectorText(text);
    setSelectorError(validation === true ? undefined : validation);
    if (validation === true) {
      setValue('spec.selector', textToSelector(text), { shouldDirty: true, shouldValidate: true });
    }
  };

  const onPortsChange = (text: string) => {
    setPortsText(text);
    const validation = validatePortsText(text);
    setPortsError(validation === true ? undefined : validation);
    if (validation === true) {
      setValue('spec.ports', textToPorts(text), { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmit = (data: IoK8sApiCoreV1Service) => {
    const nextSelectorError =
      validateSelectorText(selectorText) === true
        ? undefined
        : (validateSelectorText(selectorText) as string);
    const nextPortsError =
      validatePortsText(portsText) === true ? undefined : (validatePortsText(portsText) as string);

    setSelectorError(nextSelectorError);
    setPortsError(nextPortsError);

    if (nextSelectorError || nextPortsError) {
      return;
    }

    const payload: IoK8sApiCoreV1Service = {
      ...data,
      spec: {
        ...data.spec,
        ports: textToPorts(portsText),
        selector: textToSelector(selectorText),
      },
    };

    const k8sPromise = isCreationForm
      ? k8sCreate({ data: payload, model: ServiceModel })
      : k8sUpdate({
          data: payload,
          model: ServiceModel,
          name: getName(payload),
          ns: getNamespace(payload),
        });

    k8sPromise
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

          <FormGroup fieldId={SELECTOR_FIELD_ID} isRequired label={t('Selector')}>
            <TextArea
              aria-invalid={Boolean(selectorError)}
              aria-label={t('Selector')}
              id={SELECTOR_FIELD_ID}
              onChange={(_event, text) => onSelectorChange(text)}
              resizeOrientation="vertical"
              rows={3}
              validated={selectorError ? ValidatedOptions.error : ValidatedOptions.default}
              value={selectorText}
            />
            <FormGroupHelperText
              validated={selectorError ? ValidatedOptions.error : ValidatedOptions.default}
            >
              {selectorError || t('One label per line as key=value (e.g. app=MyApp).')}
            </FormGroupHelperText>
          </FormGroup>

          <FormGroup fieldId={PORTS_FIELD_ID} isRequired label={t('Ports')}>
            <TextArea
              aria-invalid={Boolean(portsError)}
              aria-label={t('Ports')}
              id={PORTS_FIELD_ID}
              onChange={(_event, text) => onPortsChange(text)}
              resizeOrientation="vertical"
              rows={3}
              validated={portsError ? ValidatedOptions.error : ValidatedOptions.default}
              value={portsText}
            />
            <FormGroupHelperText
              validated={portsError ? ValidatedOptions.error : ValidatedOptions.default}
            >
              {portsError || t('One port per line as port:targetPort/PROTOCOL (e.g. 80:9376/TCP).')}
            </FormGroupHelperText>
          </FormGroup>

          <ServiceFormActions
            apiError={apiError}
            isCreationForm={isCreationForm}
            isFormValid={!selectorError && !portsError}
          />
        </Form>
      </FormProvider>
    </PageSection>
  );
};

export default ServiceForm;
