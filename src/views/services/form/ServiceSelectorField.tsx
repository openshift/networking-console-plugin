import React, { FC, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trans } from 'react-i18next';

import { PodModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  Button,
  ButtonVariant,
  Content,
  FormGroup,
  ValidatedOptions,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import LabelSelectorEditor from '@utils/components/LabelSelectorEditor/LabelSelectorEditor';
import SelectorPreview from '@utils/components/SelectorPreview/SelectorPreview';
import { labelPairsToRecord } from '@utils/components/SelectorPreview/utils/utils';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import { SELECTOR_FIELD_ID } from './utils/constants';
import { validateSelectorPairs } from './utils/validationUtils';

type ServiceSelectorFieldProps = {
  labelPairs: string[][];
  namespace: string;
  onLabelPairsChange: (pairs: string[][], error?: string) => void;
  selectorError?: string;
};

const ServiceSelectorField: FC<ServiceSelectorFieldProps> = ({
  labelPairs,
  namespace,
  onLabelPairsChange,
  selectorError,
}) => {
  const { t } = useNetworkingTranslation();
  const { setValue } = useFormContext<IoK8sApiCoreV1Service>();
  const podsPreviewPopoverRef = useRef<HTMLElement>();

  const onPairsChange = (pairs: string[][]) => {
    const nextPairs = isEmpty(pairs) ? [['', '']] : pairs;
    const { errorMessage, isValid } = validateSelectorPairs(t, nextPairs);

    onLabelPairsChange(nextPairs, isValid ? undefined : errorMessage);

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
      <Content component="p">
        <Trans t={t}>
          Show a preview of the{' '}
          <Button
            data-test="show-matching-pods"
            isInline
            ref={podsPreviewPopoverRef}
            variant={ButtonVariant.link}
          >
            matching pods
          </Button>{' '}
          that this selector will apply to
        </Trans>
      </Content>
      <SelectorPreview
        dataTest="service-pods-preview"
        labelSelector={labelPairs}
        namespace={namespace}
        popoverRef={podsPreviewPopoverRef}
        resourceModel={PodModel}
        resourceName={t('pods')}
      />
    </FormGroup>
  );
};

export default ServiceSelectorField;
