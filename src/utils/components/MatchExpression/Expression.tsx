import React, { ChangeEvent, FC, Ref, useState } from 'react';

import { MatchExpression, Operator } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  TextInput,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { ALL_OPERATORS, UNARY_OPERATORS } from './MatchExpression';

export type ExpressionProps = {
  allowedOperators?: (Operator | string)[];
  expression: MatchExpression;
  onChange: (expression: MatchExpression) => void;
  onClickRemove: () => void;
};

export const Expression: FC<ExpressionProps> = ({
  allowedOperators = ALL_OPERATORS,
  expression,
  onChange,
  onClickRemove,
}) => {
  const { key, operator, values } = expression;
  const { t } = useNetworkingTranslation();
  const valueDisabled = UNARY_OPERATORS.includes(operator as Operator);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  return (
    <FormGroup isInline label=" " role="group">
      <FormGroup fieldId="expression-key" label={t('Key')}>
        <TextInput
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange({ ...expression, key: e.target.value })
          }
          type="text"
          value={expression.key ?? ''}
        />
      </FormGroup>
      <FormGroup fieldId="expression-operator" label={t('Operator')}>
        <Dropdown
          id="operator"
          isOpen={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          onSelect={() => setIsDropdownOpen(false)}
          selected={expression.operator}
          toggle={(toggleRef: Ref<MenuToggleElement>) => (
            <MenuToggle
              id="toggle-udns-operator"
              isExpanded={isDropdownOpen}
              isFullWidth
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              ref={toggleRef}
            >
              {expression.operator ? <>{expression.operator}</> : t('Select an operator')}
            </MenuToggle>
          )}
        >
          <DropdownList>
            {allowedOperators.map((allowedOperator, i) => (
              <DropdownItem
                key={`operator-${i}`}
                onClick={() => {
                  onChange({ ...expression, operator: allowedOperator });
                }}
                value={allowedOperator}
              >
                {allowedOperator}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      </FormGroup>
      <FormGroup fieldId="expression-values" label={t('Values')}>
        <TextInput
          isDisabled={valueDisabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange({
              key,
              operator,
              values: e.target?.value?.split(',')?.map((v) => v.trim()) ?? [],
            })
          }
          type="text"
          value={valueDisabled ? '' : values?.join(',') ?? ''}
        />
      </FormGroup>
      <FormGroup label=" ">
        <Button
          aria-label="Delete"
          className="key-operator-value__delete-button"
          icon={<MinusCircleIcon />}
          onClick={onClickRemove}
          variant={ButtonVariant.plain}
        />
      </FormGroup>
    </FormGroup>
  );
};

export default Expression;
