import React, { FC } from 'react';

import { Button, TextInput, Tooltip } from '@patternfly/react-core';
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
      <div className="row pairs-list__heading">
        <div className="col-xs-5 text-secondary text-uppercase" id="editor-label-header">
          {t('Key')}
        </div>
        <div className="col-xs-5 text-secondary text-uppercase" id="editor-selector-header">
          {t('Value')}
        </div>
        <div className="col-xs-1 co-empty__header" />
      </div>
      {labelSelectorPairs.map((labelSelectorPair, index) => {
        return (
          <div className="row pairs-list__row" key={index}>
            <div className="col-xs-5 pairs-list__value-pair-field">
              <TextInput
                aria-labelledby="editor-label-header"
                id={`${index}-serial`}
                onChange={(_, value) => onChange(value, labelSelectorPair[1], index)}
                type="text"
                value={labelSelectorPair[0]}
              />
            </div>
            <div className="col-xs-5 pairs-list__name-field">
              <TextInput
                aria-labelledby="editor-selector-header"
                id={`${index}-serial`}
                onChange={(_, value) => onChange(labelSelectorPair[0], value, index)}
                type="text"
                value={labelSelectorPair[1]}
              />
            </div>
            <div className="col-xs-1 pairs-list__action">
              <Tooltip content={t('Remove')}>
                <Button
                  className="pairs-list__span-btns"
                  data-test-id="pairs-list__delete-from-btn"
                  onClick={() => onRemove(index)}
                  type="button"
                  variant="plain"
                >
                  <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
                  <span className="sr-only">{t('Delete')}</span>
                </Button>
              </Tooltip>
            </div>
          </div>
        );
      })}
      <div className="row">
        <div className="col-xs-12">
          <Button
            className="pf-m-link--align-left"
            onClick={onAddPair}
            type="button"
            variant="link"
          >
            <PlusCircleIcon /> {t('Add label')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default LabelSelectorEditor;
