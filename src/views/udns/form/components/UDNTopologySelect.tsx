import React, { FC, Ref, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Dropdown,
  DropdownItem,
  DropdownList,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Popover,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { TopologyKeys, UserDefinedNetworkFormInput } from '../utils/types';

const UserDefinedNetworkTopologySelect: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control } = useFormContext<UserDefinedNetworkFormInput>();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  return (
    <Controller
      control={control}
      name="topology"
      render={({ field: { onChange, value } }) => (
        <FormGroup
          fieldId="basic-settings-topology"
          isRequired
          label={
            <Popover
              bodyContent={
                <ul className="pf-v6-c-list" role="list">
                  <li>
                    {t(
                      'Layer3 topology creates a layer 2 segment per node, each with a different subnet. Layer 3 routing is used to interconnect node subnets.',
                    )}
                  </li>
                  <li>{t('Layer2 topology creates one logical switch shared by all nodes.')}</li>
                </ul>
              }
            >
              <label className="pf-v6-c-form__label">{t('Topology')}</label>
            </Popover>
          }
        >
          <Dropdown
            id="topology"
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            onSelect={() => setIsDropdownOpen(false)}
            selected={value}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                id="toggle-udns-topology"
                isExpanded={isDropdownOpen}
                isFullWidth
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                ref={toggleRef}
              >
                {TopologyKeys[value] || t('Topology')}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {Object.entries(TopologyKeys).map(([key, tk]) => (
                <DropdownItem
                  key={key}
                  onClick={() => {
                    onChange(key);
                  }}
                  value={key}
                >
                  {tk}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
          <FormGroupHelperText>
            {t('Topology describes network configuration.')}
          </FormGroupHelperText>
        </FormGroup>
      )}
      rules={{ required: true }}
    />
  );
};

export default UserDefinedNetworkTopologySelect;
