import React, { FC, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trans } from 'react-i18next';

import {
  DeploymentModel,
  modelToGroupVersionKind,
  PodModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import type {
  IoK8sApiAppsV1Deployment,
  IoK8sApiCoreV1Pod,
  IoK8sApiCoreV1Service,
} from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
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
  const [pods] = useK8sWatchResource<IoK8sApiCoreV1Pod[]>({
    groupVersionKind: modelToGroupVersionKind(PodModel),
    isList: true,
    namespace,
    optional: true,
  });
  const [deployments] = useK8sWatchResource<IoK8sApiAppsV1Deployment[]>({
    groupVersionKind: modelToGroupVersionKind(DeploymentModel),
    isList: true,
    namespace,
    optional: true,
  });
  const { keys: labelKeys, values: labelValues } = useMemo(() => {
    const labels = [
      ...(pods || []).map((pod) => pod.metadata?.labels),
      ...(deployments || []).flatMap((deployment) => [
        deployment.metadata?.labels,
        deployment.spec?.template?.metadata?.labels,
      ]),
    ];
    const keys = new Set<string>();
    const values: Record<string, Set<string>> = {};

    labels.forEach((labelSet) => {
      Object.entries(labelSet || {}).forEach(([key, value]) => {
        keys.add(key);
        if (value) {
          values[key] ??= new Set<string>();
          values[key].add(value);
        }
      });
    });

    return {
      keys: [...keys].sort(),
      values: Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, [...value].sort()]),
      ),
    };
  }, [deployments, pods]);

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
        helperText={
          selectorError && (
            <FormGroupHelperText validated={ValidatedOptions.error}>
              {selectorError}
            </FormGroupHelperText>
          )
        }
        labelSelectorPairs={labelPairs}
        labelSuggestions={labelKeys}
        onLastItemRemoved={() => onPairsChange([['', '']])}
        updateParentData={onPairsChange}
        valueSuggestions={labelValues}
      />
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
