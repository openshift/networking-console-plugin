import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { handleBlur } from '@utils/components/FormGroupHelperText/utils/utils';
import TechPreview from '@utils/components/TechPreview/TechPreview';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  NetworkAttachmentDefinitionFormInput,
  NetworkTypeKeys,
} from '@views/nads/form/utils/types';

import { validateSubnets } from '../../utils/utils';
import SubnetsHelperText from '../SubnetsHelperText/SubnetsHelperText';

const Layer2Parameters: FC = () => {
  const { t } = useNetworkingTranslation();
  const {
    clearErrors,
    formState: { errors },
    register,
    setError,
  } = useFormContext<NetworkAttachmentDefinitionFormInput>();
  const baseId = NetworkTypeKeys.ovnKubernetesNetworkType;
  const subnetsError = errors?.[baseId]?.subnets;
  return (
    <FormGroup label={t('Subnet')} labelHelp={<TechPreview />}>
      <TextInput
        {...register(`${baseId}.subnets`, {
          onBlur: (event) =>
            handleBlur({
              clearErrors,
              event,
              fieldName: `${baseId}.subnets`,
              setError,
              validate: validateSubnets,
            }),
          validate: validateSubnets,
        })}
      />
      <FormGroupHelperText
        validated={subnetsError ? ValidatedOptions.error : ValidatedOptions.default}
      >
        {subnetsError ? subnetsError?.message : <SubnetsHelperText />}
      </FormGroupHelperText>
    </FormGroup>
  );
};

export default Layer2Parameters;
