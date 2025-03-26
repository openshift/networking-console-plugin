import React, { FC } from 'react';
import { Controller, FieldArrayWithId, useFormContext } from 'react-hook-form';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  ButtonVariant,
  DropdownItem,
  FormGroup,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import Select from '@utils/components/Select/Select';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { RouteKind } from '@utils/types';

import {
  AS_PREFIX_FIELD_ID,
  AS_WEIGHT_PREFIX_FIELD_ID,
  ServiceGroupVersionKind,
} from './constants';

type AlternateServiceProps = {
  field: FieldArrayWithId<RouteKind, 'spec.alternateBackends', 'id'>;
  filteredServices: IoK8sApiCoreV1Service[];
  index: number;
  remove: (index: number) => void;
};

const AlternateService: FC<AlternateServiceProps> = ({
  field,
  filteredServices,
  index,
  remove,
}) => {
  const { t } = useNetworkingTranslation();

  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<RouteKind>();

  return (
    <Controller
      control={control}
      key={field.id}
      name={`spec.alternateBackends.${index}.name`}
      render={({ field: { onChange, value } }) => (
        <>
          <div className="co-add-remove-form__link--remove-entry">
            <Button
              icon={<MinusCircleIcon className="co-icon-space-r" />}
              isInline
              onClick={() => remove(index)}
              variant={ButtonVariant.link}
            >
              {t('Remove alternate Service')}
            </Button>
          </div>
          <FormGroup
            fieldId={`${AS_PREFIX_FIELD_ID}${field.id}`}
            isRequired
            label={t('Alternate Service target')}
          >
            <Select
              id={`${AS_PREFIX_FIELD_ID}${field.id}`}
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
                {filteredServices.map((service) => (
                  <DropdownItem
                    key={getName(service)}
                    onClick={() => onChange(getName(service))}
                    value={getName(service)}
                  >
                    <ResourceIcon groupVersionKind={ServiceGroupVersionKind} /> {getName(service)}
                  </DropdownItem>
                ))}
              </>
            </Select>

            <FormGroupHelperText
              validated={
                errors?.spec?.alternateBackends?.[index]?.name
                  ? ValidatedOptions.error
                  : ValidatedOptions.default
              }
            >
              {t('Alternate Service to route to.')}
            </FormGroupHelperText>
          </FormGroup>
          <FormGroup
            className="networking-route-form__service-weight-input"
            fieldId={`${AS_WEIGHT_PREFIX_FIELD_ID}${field.id}`}
            isRequired
            label={t('Alternate Service weight')}
          >
            <TextInput
              id={`${AS_WEIGHT_PREFIX_FIELD_ID}${field.id}`}
              max={255}
              min={0}
              type="number"
              {...register(`spec.alternateBackends.${index}.weight` as const, {
                setValueAs: parseInt,
              })}
            />
            <FormGroupHelperText
              validated={
                errors?.spec?.alternateBackends?.[index]?.weight
                  ? ValidatedOptions.error
                  : ValidatedOptions.default
              }
            >
              {t(
                'A number between 0 and 255 that depicts relative weight compared with other targets.',
              )}
            </FormGroupHelperText>
          </FormGroup>
        </>
      )}
    ></Controller>
  );
};

export default AlternateService;
