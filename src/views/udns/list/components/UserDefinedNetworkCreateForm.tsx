import React, { FC, FormEventHandler } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Alert, AlertVariant, Form, FormGroup, Text, TextInput } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import ClusterUDNNamespaceSelector from './ClusterUDNNamespaceSelector';
import { UDNForm } from './constants';
import SelectProject from './SelectProject';

type UserDefinedNetworkCreateFormProps = {
  error: Error;
  isClusterUDN?: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

const UserDefinedNetworkCreateForm: FC<UserDefinedNetworkCreateFormProps> = ({
  error,
  isClusterUDN,
  onSubmit,
}) => {
  const { t } = useNetworkingTranslation();

  const { control, register, setValue } = useFormContext<UDNForm>();

  const subnetField = isClusterUDN ? 'spec.network.layer2.subnets' : 'spec.layer2.subnets';

  return (
    <Form id="create-udn-form" onSubmit={onSubmit}>
      <Text>
        {t(
          'Define the network used by VirtualMachines and Pods to communicate in the given project',
        )}
      </Text>
      {!isClusterUDN && <SelectProject />}

      {isClusterUDN && (
        <FormGroup fieldId="input-name" isRequired label={t('Name')}>
          <TextInput
            autoFocus
            data-test="input-name"
            {...register('metadata.name', { required: true })}
          />
        </FormGroup>
      )}

      <FormGroup fieldId="input-udn-subnet" isRequired label={t('Subnet')}>
        <Controller
          control={control}
          name={subnetField}
          render={({ field: { value } }) => (
            <TextInput
              autoFocus
              data-test="input-udn-subnet"
              id="input-udn-subnet"
              isRequired
              name="input-udn-subnet"
              onChange={(_, newValue) =>
                setValue(subnetField, newValue.split(','), {
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

      {isClusterUDN && <ClusterUDNNamespaceSelector />}

      {error && (
        <Alert isInline title={t('Error')} variant={AlertVariant.danger}>
          {error?.message}
        </Alert>
      )}
    </Form>
  );
};

export default UserDefinedNetworkCreateForm;
