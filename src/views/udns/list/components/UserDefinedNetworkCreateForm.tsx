import React, { FC, FormEvent, FormEventHandler, Ref, useEffect, useRef, useState } from 'react';
import { Controller, FieldError, useFormContext } from 'react-hook-form';
import { Trans } from 'react-i18next';
import { Link } from 'react-router';

import {
  Alert,
  AlertVariant,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Radio,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import SubnetCIDRHelperText from '@utils/components/SubnetCIDRHelperText/SubnetCIDRHelperText';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { FIXED_PRIMARY_UDN_NAME } from '@utils/resources/udns/constants';
import {
  ClusterUserDefinedNetworkSpec,
  MACSecurityMode,
  UserDefinedNetworkRole,
  UserDefinedNetworkSpec,
} from '@utils/resources/udns/types';
import { generateName } from '@utils/utils';

import {
  CUDN_MAC_SECURITY_FIELD_PATH,
  CUDN_SUBNETS_FIELD_PATH,
  PROJECT_NAME,
  UDN_MAC_SECURITY_FIELD_PATH,
  UDN_SUBNETS_FIELD_PATH,
} from '../constants';

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

  const {
    control,
    formState: { errors },
    getValues,
    register,
    setValue,
    trigger,
    watch,
  } = useFormContext<UDNForm>();

  const roleField = udnRoleField(isClusterUDN);
  const role = watch(roleField);
  const isSecondary = role === UserDefinedNetworkRole.Secondary;
  const subnetField = isClusterUDN ? CUDN_SUBNETS_FIELD_PATH : UDN_SUBNETS_FIELD_PATH;
  const macSecurityField = isClusterUDN
    ? CUDN_MAC_SECURITY_FIELD_PATH
    : UDN_MAC_SECURITY_FIELD_PATH;
  const macSecurityMode = watch(macSecurityField as any);

  // Get nested error based on field path
  const subnetError = isClusterUDN
    ? ((errors.spec as ClusterUserDefinedNetworkSpec)?.network?.layer2
        ?.subnets as unknown as FieldError)
    : ((errors.spec as unknown as UserDefinedNetworkSpec)?.layer2
        ?.subnets as unknown as FieldError);

  const lastSecondaryName = useRef('');
  const [isMacSecurityDropdownOpen, setIsMacSecurityDropdownOpen] = useState<boolean>(false);

  // Trigger validation when MAC Security mode changes
  useEffect(() => {
    if (isSecondary) trigger(subnetField);
  }, [macSecurityMode, isSecondary, subnetField, trigger]);

  const onRoleSelect = (event: FormEvent<HTMLInputElement>, checked: boolean) => {
    if (!checked) {
      return;
    }

    const newRole = event.currentTarget.value as UserDefinedNetworkRole;
    setValue(roleField, newRole);

    if (isClusterUDN) return;

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

      <FormGroup
        fieldId="input-udn-subnet"
        isRequired={!(isSecondary && macSecurityMode === MACSecurityMode.Disabled)}
        label={t('Subnet CIDR')}
      >
        <Controller
          control={control}
          name={subnetField}
          render={({ field: { value } }) => (
            <TextInput
              autoFocus={!isClusterUDN && !isSecondary}
              data-test="input-udn-subnet"
              id="input-udn-subnet"
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
              validated={subnetError ? ValidatedOptions.error : ValidatedOptions.default}
              value={value?.join(',')}
            />
          )}
          rules={{
            validate: {
              macSecurityValidation: (value) => {
                // Get current MAC Security mode from form values
                const formValues = getValues();
                const currentMacSecurityMode = isClusterUDN
                  ? formValues.spec?.network?.layer2?.macSecurity?.mode
                  : formValues.spec?.layer2?.macSecurity?.mode;

                if (
                  isSecondary &&
                  currentMacSecurityMode === MACSecurityMode.Disabled &&
                  value &&
                  value.length > 0 &&
                  value.some((s) => s.trim())
                ) {
                  return t(
                    'Subnets must be empty when MAC Security is disabled (IPAM must be disabled)',
                  );
                }
                return true;
              },
              required: (value) => {
                // Get current MAC Security mode from form values
                const formValues = getValues();
                const currentMacSecurityMode = isClusterUDN
                  ? formValues.spec?.network?.layer2?.macSecurity?.mode
                  : formValues.spec?.layer2?.macSecurity?.mode;

                // Field is NOT required when secondary network has MAC Security disabled
                const isRequiredField = !(
                  isSecondary && currentMacSecurityMode === MACSecurityMode.Disabled
                );

                if (isRequiredField && (!value || value.length === 0)) {
                  return t('Required');
                }
                return true;
              },
            },
          }}
        />
        <FormGroupHelperText
          validated={subnetError ? ValidatedOptions.error : ValidatedOptions.default}
        >
          {subnetError?.message || <SubnetCIDRHelperText />}
        </FormGroupHelperText>
      </FormGroup>

      {isSecondary && (
        <FormGroup
          fieldId="mac-security"
          label={t('MAC Security')}
          labelHelp={
            <PopoverHelpIcon
              bodyContent={
                <Flex direction={{ default: 'column' }}>
                  <FlexItem>
                    {t(
                      'MAC Security controls whether OVN enforces that only the assigned MAC address can send traffic through a port (MAC spoof filtering).',
                    )}
                  </FlexItem>
                  <FlexItem>
                    {t(
                      'Disabling MAC Security is required for nested VMs, HA firewall appliances, and NFV workloads that need to send traffic with multiple MAC addresses.',
                    )}
                  </FlexItem>
                  <FlexItem>
                    {t(
                      'WARNING: Disabling MAC Security removes an important security protection. Only disable when your workload specifically requires it.',
                    )}
                  </FlexItem>
                  <FlexItem>
                    {t(
                      'MAC Security can only be disabled when IPAM is disabled (no subnets configured).',
                    )}
                  </FlexItem>
                </Flex>
              }
            />
          }
        >
          <Controller
            control={control}
            defaultValue={MACSecurityMode.Enabled as never}
            name={macSecurityField as any}
            render={({ field: { onChange, value } }) => (
              <Dropdown
                id="mac-security-dropdown"
                isOpen={isMacSecurityDropdownOpen}
                onSelect={() => setIsMacSecurityDropdownOpen(false)}
                selected={value || MACSecurityMode.Enabled}
                toggle={(toggleRef: Ref<MenuToggleElement>) => (
                  <MenuToggle
                    id="mac-security-toggle"
                    isExpanded={isMacSecurityDropdownOpen}
                    isFullWidth
                    onClick={() => setIsMacSecurityDropdownOpen(!isMacSecurityDropdownOpen)}
                    ref={toggleRef}
                  >
                    {value || MACSecurityMode.Enabled}
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  {Object.values(MACSecurityMode).map((mode) => (
                    <DropdownItem key={mode} onClick={() => onChange(mode)} value={mode}>
                      {mode}
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            )}
            rules={{ required: false }}
          />
        </FormGroup>
      )}

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
