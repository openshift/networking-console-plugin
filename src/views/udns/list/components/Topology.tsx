import React, { FC, Ref, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  DropdownItem,
  Flex,
  FlexItem,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Radio,
  Select,
  TextInput,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { LOCALNET_TOPOLOGY } from '@utils/resources/udns/constants';
import { UserDefinedNetworkRole, UserDefinedNetworkSpec } from '@utils/resources/udns/types';

import { UDNForm } from './constants';
import { createNetworkSpecFromRole, createNetworkSpecFromTopology, getTopology } from './utils';

type TopologyProps = {
  isClusterUDN: boolean;
};

const Topology: FC<TopologyProps> = ({ isClusterUDN }) => {
  const { t } = useNetworkingTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { register, setValue } = useFormContext<UDNForm>();

  const networkSpecPath = isClusterUDN ? 'spec.network' : 'spec';

  const networkSpec: UserDefinedNetworkSpec = useWatch<UDNForm>({
    name: networkSpecPath,
  });

  const topology = getTopology(networkSpec);

  const isPrimary =
    networkSpec?.layer2?.role === UserDefinedNetworkRole.Primary ||
    networkSpec?.layer3?.role === UserDefinedNetworkRole.Primary;

  const onChangeRole = (role: UserDefinedNetworkRole) => {
    setValue(networkSpecPath, createNetworkSpecFromRole(networkSpec, role));
  };

  return (
    <>
      <FormGroup>
        <Flex>
          <FlexItem>
            <Radio
              id="primary-topology"
              isChecked={isPrimary}
              label="Primary"
              name="radio-topology"
              onChange={() => onChangeRole(UserDefinedNetworkRole.Primary)}
            ></Radio>
          </FlexItem>
          <FlexItem>
            <Radio
              id="secondary-topology"
              isChecked={!isPrimary}
              label="Secondary"
              name="radio-topology"
              onChange={() => onChangeRole(UserDefinedNetworkRole.Secondary)}
            ></Radio>
          </FlexItem>
        </Flex>
      </FormGroup>
      <FormGroup fieldId="select-topology" isRequired label={t('Topology')}>
        <Select
          id="select-topology"
          isOpen={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          onSelect={(_, selection) => {
            setValue(
              isClusterUDN ? 'spec.network' : 'spec',
              createNetworkSpecFromTopology(selection as string, networkSpec),
            );
            setIsDropdownOpen(false);
          }}
          selected={topology}
          toggle={(toggleRef: Ref<MenuToggleElement>) => (
            <MenuToggle
              id="toggle-udns-operator"
              isDisabled={!isPrimary}
              isExpanded={isDropdownOpen}
              isFullWidth
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              ref={toggleRef}
            >
              {topology}
            </MenuToggle>
          )}
        >
          <>
            {isPrimary ? (
              <>
                <DropdownItem value="Layer2">{t('Layer 2')}</DropdownItem>
                <DropdownItem value="Layer3">{t('Layer 3')}</DropdownItem>
              </>
            ) : (
              <DropdownItem value="Locanet">{t('Localnet')}</DropdownItem>
            )}
          </>
        </Select>
      </FormGroup>

      {topology === LOCALNET_TOPOLOGY && (
        <FormGroup fieldId="input-name" isRequired label={t('Physical network name')}>
          <TextInput
            autoFocus
            {...register('spec.localnet.physicalNetworkName', { required: true })}
            isRequired
          />

          <FormGroupHelperText>
            {t(
              'The name of the physical network. This attribute must match the value of the spec.desiredState.ovn.bridge-mappings.localnet field of the NodeNetworkConfigurationPolicy object that defines the OVS bridge mapping. ',
            )}
          </FormGroupHelperText>
        </FormGroup>
      )}
    </>
  );
};

export default Topology;
