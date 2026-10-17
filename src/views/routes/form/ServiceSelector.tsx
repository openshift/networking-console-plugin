import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { ResourceIcon, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  DropdownItem,
  FormGroup,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import Loading from '@utils/components/Loading/Loading';
import Select from '@utils/components/Select/Select';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { RouteKind } from '@utils/types';

import AlternateService from './AlternateServicesSection';
import {
  DEFAULT_SERVICE_WEIGHT,
  SERVICE_FIELD_ID,
  SERVICE_WEIGHT_FIELD_ID,
  ServiceGroupVersionKind,
} from './constants';
import TargetPort from './Targetport';

type ServiceSelectorProps = {
  namespace: string;
};

const ServiceSelector: FC<ServiceSelectorProps> = ({ namespace }) => {
  const {
    control,
    formState: { errors },
    register,
    setValue,
    watch,
  } = useFormContext<RouteKind>();

  const selectedServiceName = watch('spec.to.name');

  const { t } = useNetworkingTranslation();

  const [services, loaded, error] = useK8sWatchResource<IoK8sApiCoreV1Service[]>({
    groupVersionKind: ServiceGroupVersionKind,
    isList: true,
    namespace,
  });

  const selectedService = (services || []).find(
    (service) => getName(service) === selectedServiceName,
  );

  if (error)
    return (
      <Alert title={t('Error')} variant={AlertVariant.danger}>
        {error.message}
      </Alert>
    );

  return (
    <>
      <Controller
        control={control}
        name="spec.to.name"
        render={({ field: { onChange, value } }) => (
          <>
            <FormGroup fieldId={SERVICE_FIELD_ID} isRequired label={t('Service')}>
              <Select
                id={SERVICE_FIELD_ID}
                selected={value}
                toggleContent={
                  value ? (
                    <>
                      <ResourceIcon groupVersionKind={ServiceGroupVersionKind} /> {value}
                    </>
                  ) : (
                    t('Select a Service')
                  )
                }
              >
                <>
                  {!loaded && <Loading />}
                  {loaded &&
                    (services || []).map((service) => (
                      <DropdownItem
                        key={getName(service)}
                        onClick={() => {
                          onChange(getName(service));
                          setValue('spec.port.targetPort', '');
                        }}
                        value={getName(service)}
                      >
                        <ResourceIcon groupVersionKind={ServiceGroupVersionKind} />{' '}
                        {getName(service)}
                      </DropdownItem>
                    ))}
                </>
              </Select>

              <FormGroupHelperText
                validated={
                  errors?.spec?.to?.name ? ValidatedOptions.error : ValidatedOptions.default
                }
              >
                {t('Service to route to.')}
              </FormGroupHelperText>
            </FormGroup>
            <FormGroup
              className="networking-route-form__service-weight-input"
              fieldId={SERVICE_WEIGHT_FIELD_ID}
              label={t('Service weight')}
            >
              <TextInput
                defaultValue={DEFAULT_SERVICE_WEIGHT}
                id={SERVICE_WEIGHT_FIELD_ID}
                max={255}
                min={0}
                type="number"
                {...register('spec.to.weight', {
                  max: 255,
                  min: 0,
                  required: false,
                  setValueAs: parseInt,
                })}
              />

              <FormGroupHelperText
                validated={
                  errors?.spec?.to?.weight ? ValidatedOptions.error : ValidatedOptions.default
                }
              >
                {t(
                  'A number between 0 and 255 that depicts relative weight compared with other targets.',
                )}
              </FormGroupHelperText>
            </FormGroup>
          </>
        )}
        rules={{ required: true }}
      />
      {selectedService && (
        <AlternateService
          services={services?.filter((service) => getName(service) !== getName(selectedService))}
        />
      )}
      <TargetPort service={selectedService} />
    </>
  );
};

export default ServiceSelector;
