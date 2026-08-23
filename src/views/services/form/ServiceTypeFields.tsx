import React, { FC } from 'react';

import { FormGroup, TextArea, ValidatedOptions } from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { PORTS_FIELD_ID } from './utils/constants';
import ExternalNameField from './ExternalNameField';
import ServiceSelectorField from './ServiceSelectorField';

type ServiceTypeFieldsProps = {
  isExternalName: boolean;
  labelPairs: string[][];
  namespace: string;
  onLabelPairsChange: (pairs: string[][], error?: string) => void;
  onPortsChange: (text: string) => void;
  portsError?: string;
  portsText: string;
  selectorError?: string;
};

const ServiceTypeFields: FC<ServiceTypeFieldsProps> = ({
  isExternalName,
  labelPairs,
  namespace,
  onLabelPairsChange,
  onPortsChange,
  portsError,
  portsText,
  selectorError,
}) => {
  const { t } = useNetworkingTranslation();

  if (isExternalName) {
    return <ExternalNameField />;
  }

  return (
    <>
      <ServiceSelectorField
        labelPairs={labelPairs}
        namespace={namespace}
        onLabelPairsChange={onLabelPairsChange}
        selectorError={selectorError}
      />

      <FormGroup fieldId={PORTS_FIELD_ID} isRequired label={t('Ports')}>
        <TextArea
          aria-invalid={Boolean(portsError)}
          aria-label={t('Ports')}
          data-test={PORTS_FIELD_ID}
          id={PORTS_FIELD_ID}
          onChange={(_event, text) => onPortsChange(text)}
          resizeOrientation="vertical"
          rows={3}
          validated={portsError ? ValidatedOptions.error : ValidatedOptions.default}
          value={portsText}
        />
        <FormGroupHelperText
          validated={portsError ? ValidatedOptions.error : ValidatedOptions.default}
        >
          {portsError ||
            t('One port per line as [name:]port:targetPort/PROTOCOL (e.g. http:80:9376/TCP).')}
        </FormGroupHelperText>
      </FormGroup>
    </>
  );
};

export default ServiceTypeFields;
