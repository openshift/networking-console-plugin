import React, { FC, Ref, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Checkbox,
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

const Layer2Parameters: FC = () => {
  const { t } = useNetworkingTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const { control, register } = useFormContext<UserDefinedNetworkFormInput>();
  return (
    <>
      <FormGroup
        label={
          <Popover
            bodyContent={
              <Flex direction={{ default: 'column' }}>
                <FlexItem>
                  {t(
                    'The only allowed value is Persistent. When set, OVN Kubernetes assigned IP addresses will be persisted in an "ipamclaims.k8s.cni.cncf.io" object.',
                  )}
                </FlexItem>
                <FlexItem>
                  {t('These IP addresses will be reused by other pods if requested.')}
                </FlexItem>
                <FlexItem>{t('Only supported when "subnets" are set.')}</FlexItem>
              </Flex>
            }
          >
            <label className="pf-v6-c-form__label">{t('IPAMLifecycle')}</label>
          </Popover>
        }
      >
        <Controller
          control={control}
          defaultValue={false as never}
          name={`${TopologyKeys.Layer2}.ipam.lifecycle`}
          render={({ field: { onChange, value } }) => (
            <Checkbox
              id={`${TopologyKeys.Layer2}.ipam.lifecycle`}
              isChecked={value}
              label={t('Persistent')}
              onChange={onChange}
            />
          )}
        />
        <FormGroupHelperText>
          {t('IPAMLifecycle controls IP addresses management lifecycle.')}
        </FormGroupHelperText>
      </FormGroup>
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
          {...register(`${TopologyKeys.Layer2}.mtu`, { max: 65536, min: 0, required: false })}
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
          name={`${TopologyKeys.Layer2}.role`}
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
        name={`${TopologyKeys.Layer2}.subnets`}
        render={({ field: { onChange, value } }) => (
          <UDNSubnets
            description={t('Subnets are used for the pod network across the cluster.')}
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
                        'The format should match standard CIDR notation (for example, "10.128.0.0/16").',
                      )}
                    </FlexItem>
                    <FlexItem>
                      {t(
                        'This field may be omitted. In that case the logical switch implementing the network only provides layer 2 communication, and users must configure IP addresses for the pods. As a consequence, Port security only prevents MAC spoofing.',
                      )}
                    </FlexItem>
                  </Flex>
                }
              >
                <label className="pf-v6-c-form__label">{t('Subnets')}</label>
              </Popover>
            }
          />
        )}
        rules={{ required: false }}
      />
      <Controller
        control={control}
        name={`${TopologyKeys.Layer2}.joinSubnets`}
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
                    <FlexItem>{t('This field is only allowed for "Primary" network.')}</FlexItem>
                    <FlexItem>
                      {t(
                        'It is not recommended to set this field without explicit need and understanding of the OVN network topology.',
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

export default Layer2Parameters;
