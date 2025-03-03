import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { FormGroup, FormSection, Popover } from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { MatchExpressions } from '@utils/components/MatchExpression/MatchExpression';
import MatchLabels from '@utils/components/MatchLabels/MatchLabels';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { UserDefinedNetworkFormInput } from '../utils/types';

const ClusterUserDefinedNetworkNamespaceSelector: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control } = useFormContext<UserDefinedNetworkFormInput>();
  const namespaceSelectorTitle = t('Namespace Selector');

  return (
    <FormSection title={namespaceSelectorTitle} titleElement="h2">
      <Controller
        control={control}
        name="namespaceSelector.matchLabels"
        render={({ field: { onChange, value } }) => (
          <MatchLabels matchLabels={value} onChange={onChange} />
        )}
      />
      <Controller
        control={control}
        name="namespaceSelector.matchExpressions"
        render={({ field: { onChange, value } }) => (
          <FormGroup
            fieldId="basic-settings-matchExpressions"
            label={
              <Popover
                bodyContent={
                  <ul className="pf-v6-c-list" role="list">
                    <li>{t('key is the label key that the selector applies')}</li>
                    <li>
                      {t(
                        "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist.",
                      )}
                    </li>
                    <li>
                      {t(
                        'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.',
                      )}
                    </li>
                  </ul>
                }
              >
                <label className="pf-v6-c-form__label">{t('Match Expressions')}</label>
              </Popover>
            }
          >
            <MatchExpressions matchExpressions={value} onChange={(me) => onChange(me)} />
            <FormGroupHelperText>
              {t(
                'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
              )}
            </FormGroupHelperText>
          </FormGroup>
        )}
      />
    </FormSection>
  );
};

export default ClusterUserDefinedNetworkNamespaceSelector;
