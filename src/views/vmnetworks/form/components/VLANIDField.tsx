import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { FormGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { MAX_VLAN_ID, MIN_VLAN_ID, VMNetworkForm } from '../constants';

const VLANIDField: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control } = useFormContext<VMNetworkForm>();

  const getValidatedOption = (value: number) => {
    return isNaN(value) || (value >= MIN_VLAN_ID && value <= MAX_VLAN_ID)
      ? ValidatedOptions.default
      : ValidatedOptions.error;
  };

  return (
    <FormGroup
      fieldId="vlanID"
      label={t('VLAN ID')}
      labelHelp={
        <PopoverHelpIcon
          bodyContent={t(
            'Your physical network switch must be configured with a VLAN trunk that is permitted to carry traffic for this specific ID.',
          )}
          headerContent={t('VLAN ID')}
        />
      }
    >
      <Controller
        control={control}
        name="network.spec.network.localnet.vlan.access.id"
        render={({ field: { onChange, value } }) => {
          const numberValue = (value as unknown) === '' ? NaN : value;
          const validated = getValidatedOption(numberValue);

          return (
            <>
              <TextInput
                max={MAX_VLAN_ID}
                min={MIN_VLAN_ID}
                onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
                type="number"
                validated={validated}
                value={numberValue}
              />
              <FormGroupHelperText validated={validated}>
                {t('VLAN ID must be between {{min}}-{{max}}', {
                  max: MAX_VLAN_ID,
                  min: MIN_VLAN_ID,
                })}
              </FormGroupHelperText>
            </>
          );
        }}
      />
    </FormGroup>
  );
};

export default VLANIDField;
