import React, { FC, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { PodModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { Content, FormGroup, ValidatedOptions } from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import LabelSelectorEditor from '@utils/components/LabelSelectorEditor/LabelSelectorEditor';
import SelectorPreview, {
  labelPairsToRecord,
  recordToLabelPairs,
} from '@utils/components/SelectorPreview';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import { SELECTOR_FIELD_ID } from './utils/constants';
import { validateSelectorPairs } from './utils/validationUtils';

type ServiceSelectorFieldProps = {
  namespace: string;
};

const ServiceSelectorField: FC<ServiceSelectorFieldProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const { setValue, watch } = useFormContext<IoK8sApiCoreV1Service>();
  const podsPreviewPopoverRef = useRef<HTMLElement>();

  const selector = watch('spec.selector') || {};
  const [labelPairs, setLabelPairs] = useState<string[][]>(() => recordToLabelPairs(selector));
  const [selectorError, setSelectorError] = useState<string>();

  const onPairsChange = (pairs: string[][]) => {
    const nextPairs = isEmpty(pairs) ? [['', '']] : pairs;
    setLabelPairs(nextPairs);

    const { errorMessage, isValid } = validateSelectorPairs(nextPairs);
    setSelectorError(isValid ? undefined : errorMessage);

    if (isValid) {
      setValue('spec.selector', labelPairsToRecord(nextPairs), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <FormGroup fieldId={SELECTOR_FIELD_ID} isRequired label={t('Selector')}>
      <Content component="p">
        {t('Pods having all the supplied key/value pairs as labels will be selected.')}
      </Content>
      <LabelSelectorEditor
        labelSelectorPairs={labelPairs}
        onLastItemRemoved={() => onPairsChange([['', '']])}
        updateParentData={onPairsChange}
      />
      <FormGroupHelperText
        validated={selectorError ? ValidatedOptions.error : ValidatedOptions.default}
      >
        {selectorError}
      </FormGroupHelperText>
      <SelectorPreview
        dataTest="service-pods-preview"
        labelSelector={labelPairs}
        namespace={namespace}
        popoverRef={podsPreviewPopoverRef}
        resourceModel={PodModel}
      />
    </FormGroup>
  );
};

export default ServiceSelectorField;
