import React, { FC } from 'react';

import { Button, ButtonVariant, Grid, GridItem, TextInput, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type LabelSelectorEditorProps = {
  labelSelectorPairs: string[][];
  onLastItemRemoved: () => void;
  updateParentData: (newLabelSelectorPairs: string[][]) => void;
};

const LabelSelectorEditor: FC<LabelSelectorEditorProps> = ({
  labelSelectorPairs,
  onLastItemRemoved,
  updateParentData,
}) => {
  const { t } = useNetworkingTranslation();

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
        <GridItem id="editor-label-header" sm={5}>
          {t('Key')}
        </GridItem>
        <GridItem id="editor-selector-header" sm={5}>
          {t('Value')}
        </GridItem>
        {labelSelectorPairs.map((labelSelectorPair, index) => {
          return (
            <GridItem key={index}>
              <Grid hasGutter>
                <GridItem sm={5}>
                  <TextInput
                    aria-labelledby="editor-label-header"
                    id={`${index}-serial`}
                    onChange={(_, value) => onChange(value, labelSelectorPair[1], index)}
                    type="text"
                    value={labelSelectorPair[0]}
                  />
                </GridItem>
                <GridItem sm={5}>
                  <TextInput
                    aria-labelledby="editor-selector-header"
                    id={`${index}-serial`}
                    onChange={(_, value) => onChange(labelSelectorPair[0], value, index)}
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
                      variant={ButtonVariant.plain}
                    />
                  </Tooltip>
                </GridItem>
              </Grid>
            </GridItem>
          );
        })}
        <GridItem>
          <Button icon={<PlusCircleIcon />} onClick={onAddPair} variant={ButtonVariant.link}>
            {t('Add label')}
          </Button>
        </GridItem>
      </Grid>
    </>
  );
};

export default LabelSelectorEditor;
