import React, { FC } from 'react';

import ExternalNameField from './ExternalNameField';
import ServiceSelectorField from './ServiceSelectorField';

type ServiceTypeFieldsProps = {
  isExternalName: boolean;
  labelPairs: string[][];
  namespace: string;
  onLabelPairsChange: (pairs: string[][], error?: string) => void;
  selectorError?: string;
};

const ServiceTypeFields: FC<ServiceTypeFieldsProps> = ({
  isExternalName,
  labelPairs,
  namespace,
  onLabelPairsChange,
  selectorError,
}) => {
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
    </>
  );
};

export default ServiceTypeFields;
