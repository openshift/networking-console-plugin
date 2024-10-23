import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Alert, AlertVariant, Checkbox, FormGroup, Text, TextInput } from '@patternfly/react-core';

import { CreateProjectModalFormState } from '../constants';

const NetworkTab: FC = () => {
  const { t } = useTranslation();
  const { control, register, setValue, watch } = useFormContext<CreateProjectModalFormState>();

  const createUDN = watch('createUDN');

  return (
    <div className="create-project-modal__networktab">
      <Alert
        className="create-project-modal__network-alert"
        isInline
        title={t(
          'Create Primary UserDefinedNetwork to assign VirtualMachines and Pods to communicate over it in this project.',
        )}
        variant={AlertVariant.info}
      >
        <Text>
          {t('This network must be created before you create any workload in this project')}
        </Text>
      </Alert>

      <Controller
        control={control}
        name="createUDN"
        render={({ field: { onChange, value } }) => (
          <Checkbox
            className="form-checkbox"
            id="create-udn"
            isChecked={value}
            label={t('Create Primary UserDefinedNetwork')}
            name="create-udn"
            onChange={onChange}
          />
        )}
      />

      {createUDN && (
        <>
          <FormGroup fieldId="input-name" isRequired label={t('Name')}>
            <TextInput
              autoFocus
              data-test="input-udn-name"
              id="input-udn-name"
              name="input-udn-name"
              {...register('udn.metadata.name', { required: true })}
              isRequired
              type="text"
            />
          </FormGroup>

          <FormGroup fieldId="input-name" isRequired label={t('Subnet')}>
            <Controller
              control={control}
              name="udn.spec.layer2.subnets"
              render={({ field: { value } }) => (
                <TextInput
                  autoFocus
                  data-test="input-udn-subnet"
                  id="input-udn-subnet"
                  isRequired
                  name="input-udn-subnet"
                  onChange={(_, newValue) =>
                    setValue('udn.spec.layer2.subnets', newValue.split(','), {
                      shouldValidate: true,
                    })
                  }
                  type="text"
                  value={value?.join(',')}
                />
              )}
              rules={{ required: true }}
            />
          </FormGroup>
        </>
      )}
    </div>
  );
};

export default NetworkTab;
