import React, { FC, FormEventHandler } from 'react';
import { useFormContext } from 'react-hook-form';

import { Alert, AlertVariant, Content, Form, FormGroup, TextInput } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import ClusterUDNNamespaceSelector from './ClusterUDNNamespaceSelector';
import { UDNForm } from './constants';
import SelectProject from './SelectProject';
import SubnetsInput from './SubnetsInput';
import Topology from './Topology';

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

  const { register } = useFormContext<UDNForm>();

  return (
    <Form id="create-udn-form" onSubmit={onSubmit}>
      <Content component="p">
        {t(
          'Define the network used by VirtualMachines and Pods to communicate in the given project',
        )}
      </Content>
      {!isClusterUDN && <SelectProject />}

      {isClusterUDN && (
        <FormGroup fieldId="input-name" isRequired label={t('Name')}>
          <TextInput
            autoFocus
            data-test="input-name"
            id="input-name"
            {...register('metadata.name', { required: true })}
            isRequired
            name="name"
          />
        </FormGroup>
      )}

      <SubnetsInput isClusterUDN={isClusterUDN} />

      <Topology isClusterUDN={isClusterUDN} />
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
