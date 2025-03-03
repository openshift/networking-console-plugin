import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Checkbox, FormGroup, TextInput } from '@patternfly/react-core';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  NetworkAttachmentDefinitionFormInput,
  NetworkTypeKeys,
} from '@views/nads/form/utils/types';

const BridgeParameters: FC = () => {
  const { t } = useNetworkingTranslation();

  const { control, register } = useFormContext<NetworkAttachmentDefinitionFormInput>();
  return (
    <>
      <FormGroup isRequired label={t('Bridge name')}>
        <TextInput
          {...register(`${NetworkTypeKeys.cnvBridgeNetworkType}.bridge`, { required: true })}
        />
      </FormGroup>
      <FormGroup
        label={t('VLAN tag number')}
        labelHelp={<PopoverHelpIcon bodyContent={t('Example: 100')} />}
      >
        <TextInput {...register(`${NetworkTypeKeys.cnvBridgeNetworkType}.vlanTagNum`)} />
      </FormGroup>
      <Controller
        control={control}
        defaultValue={true as never}
        name={`${NetworkTypeKeys.cnvBridgeNetworkType}.macspoofchk`}
        render={({ field: { onChange, value } }) => (
          <Checkbox
            id={`${NetworkTypeKeys.cnvBridgeNetworkType}.macspoofchk`}
            isChecked={value}
            label={t('MAC spoof check')}
            onChange={onChange}
          />
        )}
      />
    </>
  );
};

export default BridgeParameters;
