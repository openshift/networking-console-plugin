import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { FormGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { EXTERNAL_NAME_FIELD_ID } from './utils/constants';
import { validateExternalName } from './utils/validationUtils';

const ExternalNameField: FC = () => {
  const { t } = useNetworkingTranslation();
  const {
    formState: { errors },
    register,
  } = useFormContext<IoK8sApiCoreV1Service>();

  const externalNameError = errors?.spec?.externalName;

  return (
    <FormGroup fieldId={EXTERNAL_NAME_FIELD_ID} isRequired label={t('External name')}>
      <TextInput
        aria-invalid={Boolean(externalNameError)}
        aria-label={t('External name')}
        data-test={EXTERNAL_NAME_FIELD_ID}
        id={EXTERNAL_NAME_FIELD_ID}
        validated={externalNameError ? ValidatedOptions.error : ValidatedOptions.default}
        {...register('spec.externalName', {
          validate: (value) => {
            const { errorMessage, isValid } = validateExternalName(t, value);
            return isValid || errorMessage;
          },
        })}
      />
      <FormGroupHelperText
        validated={externalNameError ? ValidatedOptions.error : ValidatedOptions.default}
      >
        {externalNameError
          ? (externalNameError.message as string)
          : t('External DNS name this service resolves to (e.g. example.com).')}
      </FormGroupHelperText>
    </FormGroup>
  );
};

export default ExternalNameField;
