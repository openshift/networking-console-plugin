import React, { FC, FormEventHandler } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';

import { Alert, AlertVariant, Content, Form, FormGroup, TextInput } from '@patternfly/react-core';
import SubnetCIDRHelperText from '@utils/components/SubnetCIDRHelperText/SubnetCIDRHelperText';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
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
      <Content component="p">
        <Trans t={t}>
          Define the network used by VirtualMachines and Pods to communicate in the given project.
          Learn more about{' '}
          <Link target="_blank" to={getDocumentationURL(documentationURLs.primaryUDN)}>
            primary user-defined network
          </Link>
          .
        </Trans>
      </Content>

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

      <FormGroup fieldId="input-udn-subnet" isRequired label={t('Subnet CIDR')}>
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

        <SubnetCIDRHelperText />
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
