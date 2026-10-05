import React, { FC, FormEvent, FormEventHandler, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Trans } from 'react-i18next';
import { Link } from 'react-router';

import {
  Alert,
  AlertVariant,
  Content,
  Flex,
  Form,
  FormGroup,
  Radio,
  TextInput,
} from '@patternfly/react-core';
import SubnetCIDRHelperText from '@utils/components/SubnetCIDRHelperText/SubnetCIDRHelperText';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { FIXED_PRIMARY_UDN_NAME } from '@utils/resources/udns/constants';
import { UserDefinedNetworkRole } from '@utils/resources/udns/types';
import { generateName } from '@utils/utils';

import { PROJECT_NAME } from '../constants';

import ClusterUDNNamespaceSelector from './ClusterUDNNamespaceSelector';
import { UDNForm } from './constants';
import SelectProject from './SelectProject';
import { udnRoleField } from './utils';

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

  const { control, register, setValue, watch } = useFormContext<UDNForm>();

  const roleField = udnRoleField(isClusterUDN);
  const role = watch(roleField);
  const isSecondary = role === UserDefinedNetworkRole.Secondary;
  const subnetField = isClusterUDN ? 'spec.network.layer2.subnets' : 'spec.layer2.subnets';
  const lastSecondaryName = useRef('');

  const onRoleSelect = (event: FormEvent<HTMLInputElement>, checked: boolean) => {
    if (!checked) {
      return;
    }

    const newRole = event.currentTarget.value as UserDefinedNetworkRole;
    setValue(roleField, newRole);

    if (isClusterUDN) {
      return;
    }

    const currentName = watch('metadata.name');

    if (newRole === UserDefinedNetworkRole.Primary) {
      if (currentName && currentName !== FIXED_PRIMARY_UDN_NAME) {
        lastSecondaryName.current = currentName;
      }
      setValue('metadata.name', FIXED_PRIMARY_UDN_NAME);
      setValue(PROJECT_NAME, '');
      return;
    }

    setValue('metadata.name', lastSecondaryName.current || generateName('udn'));
  };

  return (
    <Form id="create-udn-form" onSubmit={onSubmit}>
      <Content component="p">
        {isSecondary ? (
          t(
            'Secondary network is only assigned to pods that use k8s.v1.cni.cncf.io/networks annotation to select given network.',
          )
        ) : (
          <Trans t={t}>
            Define the network used by VirtualMachines and Pods to communicate in the given project.
            Learn more about{' '}
            <Link target="_blank" to={getDocumentationURL(documentationURLs.primaryUDN)}>
              primary user-defined network
            </Link>
            .
          </Trans>
        )}
      </Content>

      <FormGroup fieldId="udn-role" isRequired label={t('Role')}>
        <Flex>
          <Radio
            id="udn-role-primary"
            isChecked={!isSecondary}
            label={UserDefinedNetworkRole.Primary}
            name="udn-role"
            onChange={onRoleSelect}
            value={UserDefinedNetworkRole.Primary}
          />
          <Radio
            id="udn-role-secondary"
            isChecked={isSecondary}
            label={UserDefinedNetworkRole.Secondary}
            name="udn-role"
            onChange={onRoleSelect}
            value={UserDefinedNetworkRole.Secondary}
          />
        </Flex>
      </FormGroup>

      {!isClusterUDN && <SelectProject labeledOnly={!isSecondary} />}

      {(isClusterUDN || isSecondary) && (
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
              autoFocus={!isClusterUDN && !isSecondary}
              data-test="input-udn-subnet"
              id="input-udn-subnet"
              isRequired
              name="input-udn-subnet"
              onChange={(_, newValue) => {
                const subnets = newValue
                  ?.split(',')
                  .map((s) => s.trim())
                  .filter((s) => s);
                setValue(subnetField, subnets, {
                  shouldValidate: true,
                });
              }}
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
