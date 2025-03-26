import React, { FC } from 'react';

import { MatchExpression, Operator } from '@openshift-console/dynamic-plugin-sdk';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { Expression } from './Expression';

export const UNARY_OPERATORS = [Operator.Exists, Operator.DoesNotExist];
export const ALL_OPERATORS = Object.values(Operator);

export type MatchExpressionsProps = {
  allowedOperators?: (Operator | string)[];
  matchExpressions: MatchExpression[];
  onChange: (matchExpressions: MatchExpression[]) => void;
};

export const MatchExpressions: FC<MatchExpressionsProps> = ({
  allowedOperators = ALL_OPERATORS,
  matchExpressions = [],
  onChange,
}) => {
  const { t } = useNetworkingTranslation();

  const updateExpression = (index: number, newExpression: MatchExpression): void =>
    onChange(matchExpressions.map((exp, i) => (i === index ? newExpression : exp)));

  const removeExpression = (index: number): void =>
    onChange(matchExpressions.filter((_exp, i) => i !== index));

  const addExpression = (): void =>
    onChange([...matchExpressions, { key: '', operator: Operator.Exists, values: [] }]);

  return (
    <>
      {matchExpressions.map((expression, index) => (
        <Expression
          allowedOperators={allowedOperators}
          expression={expression}
          key={`match-expression-${index}`}
          onChange={(newExpression) => updateExpression(index, newExpression)}
          onClickRemove={() => removeExpression(index)}
        />
      ))}
      <Button
        icon={<PlusCircleIcon className="co-icon-space-r" />}
        onClick={addExpression}
        variant={ButtonVariant.link}
      >
        {t('Add expression')}
      </Button>
    </>
  );
};
