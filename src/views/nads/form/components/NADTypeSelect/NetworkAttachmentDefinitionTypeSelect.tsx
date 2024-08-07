import React, { FC, Ref, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Dropdown,
  DropdownItem,
  DropdownList,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import useNetworkItems from '../../hooks/useNetworkItems';
import { NetworkAttachmentDefinitionFormInput } from '../../utils/types';

import MissingOperatorsAlert from './components/MissingOperatorsAlert';

const NetworkAttachmentDefinitionTypeSelect: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control } = useFormContext<NetworkAttachmentDefinitionFormInput>();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const networkTypeItems = useNetworkItems();

  const networkTypeTitle = t('Network Type');

  return (
    <Controller
      control={control}
      name="networkType"
      render={({ field: { onChange, value } }) => (
        <FormGroup fieldId="basic-settings-network-type" isRequired label={networkTypeTitle}>
          <MissingOperatorsAlert networkTypeItems={networkTypeItems} />
          <Dropdown
            id="network-type"
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            onSelect={() => setIsDropdownOpen(false)}
            selected={value}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                id="toggle-nads-network-type"
                isExpanded={isDropdownOpen}
                isFullWidth
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                ref={toggleRef}
              >
                {networkTypeItems[value] || networkTypeTitle}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {Object.entries(networkTypeItems).map(([type, label]) => (
                <DropdownItem
                  key={type}
                  onClick={() => {
                    onChange(type);
                  }}
                  value={type}
                >
                  {label}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </FormGroup>
      )}
      rules={{ required: true }}
    />
  );
};

export default NetworkAttachmentDefinitionTypeSelect;
