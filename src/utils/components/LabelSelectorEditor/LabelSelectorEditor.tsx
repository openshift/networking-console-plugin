import React, { FC, ReactNode, useId } from 'react';

import { Button, ButtonVariant, Grid, GridItem, TextInput, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type LabelSelectorEditorProps = {
  helperText?: ReactNode;
  labelSelectorPairs: string[][];
  labelSuggestions?: string[];
  onLastItemRemoved: () => void;
  updateParentData: (newLabelSelectorPairs: string[][]) => void;
  valueSuggestions?: Record<string, string[]>;
};

const LabelSelectorEditor: FC<LabelSelectorEditorProps> = ({
  helperText,
  labelSelectorPairs,
  labelSuggestions = [],
  onLastItemRemoved,
  updateParentData,
  valueSuggestions = [],
}) => {
  const { t } = useNetworkingTranslation();
  const idPrefix = useId();
  const keyHeaderId = `${idPrefix}-key-header`;
  const keysListId = `${idPrefix}-keys`;
  const valueHeaderId = `${idPrefix}-value-header`;

  const onChange = (label: string, selector: string, index: number) => {
    const newPairs = [...labelSelectorPairs];

    newPairs[index] = [label, selector];
    updateParentData(newPairs);
  };

  const onRemove = (indexToRemove: number) => {
    updateParentData(labelSelectorPairs.filter((_, index) => indexToRemove !== index));

    if (labelSelectorPairs.length === 1) onLastItemRemoved();
  };

  const onAddPair = () => {
    updateParentData([...labelSelectorPairs, ['', '']]);
  };

  return (
    <>
      <Grid hasGutter>
        <GridItem id={keyHeaderId} sm={5}>
          {t('Key')}
        </GridItem>
        <GridItem id={valueHeaderId} sm={5}>
          {t('Value')}
        </GridItem>
        {labelSelectorPairs.map((labelSelectorPair, index) => {
          return (
            <GridItem key={index}>
              <Grid hasGutter>
                <GridItem sm={5}>
                  <TextInput
                    aria-labelledby={keyHeaderId}
                    id={`${idPrefix}-${index}-key`}
                    list={keysListId}
                    onChange={(_, value) => onChange(value, labelSelectorPair[1], index)}
                    ouiaId="pairs-list-name"
                    type="text"
                    value={labelSelectorPair[0]}
                  />
                </GridItem>
                <GridItem sm={5}>
                  <TextInput
                    aria-labelledby={valueHeaderId}
                    id={`${idPrefix}-${index}-value`}
                    list={`${idPrefix}-values-${index}`}
                    onChange={(_, value) => onChange(labelSelectorPair[0], value, index)}
                    ouiaId="pairs-list-value"
                    type="text"
                    value={labelSelectorPair[1]}
                  />
                </GridItem>
                <GridItem sm={1}>
                  <Tooltip content={t('Remove')}>
                    <Button
                      data-test-id="pairs-list__delete-from-btn"
                      icon={
                        <>
                          <MinusCircleIcon />
                          <span className="sr-only">{t('Delete')}</span>
                        </>
                      }
                      onClick={() => onRemove(index)}
                      ouiaId="pairs-list-delete"
                      variant={ButtonVariant.plain}
                    />
                  </Tooltip>
                </GridItem>
              </Grid>
            </GridItem>
          );
        })}
        {helperText && <GridItem span={12}>{helperText}</GridItem>}
        <GridItem>
          <Button
            icon={<PlusCircleIcon />}
            onClick={onAddPair}
            ouiaId="pairs-list-add"
            variant={ButtonVariant.link}
          >
            {t('Add label')}
          </Button>
        </GridItem>
      </Grid>
      <datalist id={keysListId}>
        {labelSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      {labelSelectorPairs.map((labelSelectorPair, index) => (
        <datalist id={`${idPrefix}-values-${index}`} key={index}>
          {(valueSuggestions[labelSelectorPair[0]] || []).map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ))}
    </>
  );
};

export default LabelSelectorEditor;
