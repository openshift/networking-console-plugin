import React, { FC } from 'react';

import { MatchLabels } from '@openshift-console/dynamic-plugin-sdk';
import { FormGroup } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import FormGroupHelperText from '../FormGroupHelperText/FormGroupHelperText';
import SelectorInput from '../PodSelectorModal/SelectorInput';

type MatchLabelsProps = {
  fieldId?: string;
  matchLabels: MatchLabels;
  onChange: (matchlabels: MatchLabels) => void;
};

const MatchLabels: FC<MatchLabelsProps> = ({
  fieldId = 'match-labels',
  matchLabels = {},
  onChange,
}) => {
  const { t } = useNetworkingTranslation();

  return (
    <FormGroup fieldId={fieldId} isRequired label={t('Match Labels')}>
      <SelectorInput
        autoFocus
        inputProps={{ id: fieldId }}
        onChange={(arr) =>
          onChange(
            arr.reduce((acc, v) => {
              const split = v.split('=');
              return ((acc[split[0]] = split[1]), acc);
            }, {}),
          )
        }
        tags={Object.keys(matchLabels).map((key) => `${key}=${matchLabels[key]}`)}
      />
      <FormGroupHelperText>
        {t(
          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.',
        )}
      </FormGroupHelperText>
    </FormGroup>
  );
};

export default MatchLabels;
