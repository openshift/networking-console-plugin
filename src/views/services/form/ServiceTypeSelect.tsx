import React, { FC, Ref, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { SERVICE_TYPE_FIELD_ID, SERVICE_TYPES } from './utils/constants';

const ServiceTypeSelect: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control, setValue } = useFormContext<IoK8sApiCoreV1Service>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <Controller
      control={control}
      name="spec.type"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormGroup fieldId={SERVICE_TYPE_FIELD_ID} isRequired label={t('Type')}>
          <Dropdown
            id={SERVICE_TYPE_FIELD_ID}
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            onSelect={() => setIsDropdownOpen(false)}
            selected={value}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                aria-invalid={Boolean(error)}
                aria-label={t('Type')}
                id="toggle-service-type"
                isExpanded={isDropdownOpen}
                isFullWidth
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                ref={toggleRef}
                status={error ? 'danger' : undefined}
              >
                {value || t('Type')}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {SERVICE_TYPES.map((type) => (
                <DropdownItem
                  key={type}
                  onClick={() => {
                    onChange(type);
                    if (type === 'ExternalName') {
                      setValue('spec.selector', undefined, { shouldDirty: true });
                      setValue('spec.ports', undefined, { shouldDirty: true });
                    } else {
                      setValue('spec.externalName', undefined, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  value={type}
                >
                  {type}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </FormGroup>
      )}
      rules={{ required: t('Type is required') }}
    />
  );
};

export default ServiceTypeSelect;
