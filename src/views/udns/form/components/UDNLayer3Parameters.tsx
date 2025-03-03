import React, { FC, Ref, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Popover,
  TextInput,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { UserDefinedNetworkRole } from '@utils/resources/udns/types';

import { TopologyKeys, UserDefinedNetworkFormInput } from '../utils/types';

import UDNSubnets from './UDNSubnets';

const Layer3Parameters: FC = () => {
  const { t } = useNetworkingTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const { control, register } = useFormContext<UserDefinedNetworkFormInput>();
  return (
    <>
      <FormGroup
        label={
          <Popover
            bodyContent={t(
              'MTU is optional, if not provided, the globally configured value in OVN-Kubernetes (defaults to 1400) is used for the network.',
            )}
          >
            <label className="pf-v6-c-form__label">{t('MTU')}</label>
          </Popover>
        }
      >
        <TextInput
          type="number"
          {...register(`${TopologyKeys.Layer3}.mtu`, { max: 65536, min: 0, required: false })}
        />
        <FormGroupHelperText>
          {t('MTU is the maximum transmission unit for a network.')}
        </FormGroupHelperText>
      </FormGroup>
      <FormGroup
        label={
          <Popover
            bodyContent={
              <ul className="pf-v6-c-list" role="list">
                <li>
                  {t(
                    'Primary network is automatically assigned to every pod created in the same namespace.',
                  )}
                </li>
                <li>
                  {t(
                    'Secondary network is only assigned to pods that use k8s.v1.cni.cncf.io/networks annotation to select given network.',
                  )}
                </li>
              </ul>
            }
          >
            <label className="pf-v6-c-form__label">{t('Role')}</label>
          </Popover>
        }
      >
        <Controller
          control={control}
          name={`${TopologyKeys.Layer3}.role`}
          render={({ field: { onChange, value } }) => (
            <Dropdown
              id="role-dropdown"
              isOpen={isDropdownOpen}
              onSelect={() => setIsDropdownOpen(false)}
              selected={value}
              toggle={(toggleRef: Ref<MenuToggleElement>) => (
                <MenuToggle
                  id="role-toggle"
                  isExpanded={isDropdownOpen}
                  isFullWidth
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  ref={toggleRef}
                >
                  {value || t('Select role')}
                </MenuToggle>
              )}
            >
              <DropdownList>
                {Object.values(UserDefinedNetworkRole).map((role) => {
                  return (
                    <DropdownItem
                      key={role}
                      onClick={() => {
                        onChange(role);
                      }}
                      value={role}
                    >
                      {role}
                    </DropdownItem>
                  );
                })}
              </DropdownList>
            </Dropdown>
          )}
          rules={{ required: true }}
        />
        <FormGroupHelperText>
          {t('Role describes the network role in the pod.')}
        </FormGroupHelperText>
      </FormGroup>
      <Controller
        control={control}
        name={`${TopologyKeys.Layer3}.subnets`}
        render={({ field: { onChange, value } }) => (
          <UDNSubnets
            description={t('Subnets are used for the pod network across the cluster.')}
            onSubnetsChange={onChange}
            subnets={value || [{ cidr: '' }]}
            title={
              <Popover
                bodyContent={
                  <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                      {t(
                        'Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed.',
                      )}
                    </FlexItem>
                    <FlexItem>
                      {t('Given subnet is split into smaller subnets for every node.')}
                    </FlexItem>
                  </Flex>
                }
              >
                <label className="pf-v6-c-form__label">{t('Subnets')}</label>
              </Popover>
            }
            withHostSubnet
          />
        )}
        rules={{ required: false }}
      />
      <Controller
        control={control}
        name={`${TopologyKeys.Layer3}.joinSubnets`}
        render={({ field: { onChange, value } }) => (
          <UDNSubnets
            description={t('JoinSubnets are used inside the OVN network topology.')}
            onSubnetsChange={onChange}
            subnets={value || []}
            title={
              <Popover
                bodyContent={
                  <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                      {t(
                        'Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed.',
                      )}
                    </FlexItem>
                    <FlexItem>
                      {t(
                        'This field is only allowed for "Primary" network. It is not recommended to set this field without explicit need and understanding of the OVN network topology.',
                      )}
                    </FlexItem>
                    <FlexItem>
                      {t(
                        'When omitted, the platform will choose a reasonable default which is subject to change over time.',
                      )}
                    </FlexItem>
                  </Flex>
                }
              >
                <label className="pf-v6-c-form__label">{t('JoinSubnets')}</label>
              </Popover>
            }
          />
        )}
        rules={{ required: false }}
      />
    </>
  );
};

export default Layer3Parameters;
