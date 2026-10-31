import React, { Dispatch, FC, Ref, SetStateAction, useState } from 'react';

import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { EnactmentState } from '../utils/types';

import EnactmentStateIcon from './EnactmentStateIcon';

import './enactment-state-filter.scss';

const STATES: EnactmentState[] = [
  EnactmentState.Aborted,
  EnactmentState.Available,
  EnactmentState.Failing,
  EnactmentState.Pending,
  EnactmentState.Progressing,
];

type EnactmentStateFilterProps = {
  selectedFilterType: EnactmentState[];
  setSelectedFilterType: Dispatch<SetStateAction<EnactmentState[]>>;
};

const EnactmentStateFilter: FC<EnactmentStateFilterProps> = ({
  selectedFilterType,
  setSelectedFilterType,
}) => {
  const { t } = useNetworkingTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const onSelect = (state: EnactmentState) =>
    setSelectedFilterType((selected) =>
      selected.includes(state)
        ? selected.filter((candidate) => candidate !== state)
        : [...selected, state],
    );

  return (
    <Select
      className="enactment-state-filter"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(_event, value) => onSelect(value as EnactmentState)}
      role="menu"
      selected={selectedFilterType}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle isExpanded={isOpen} onClick={() => setIsOpen((open) => !open)} ref={toggleRef}>
          {t('State')}
        </MenuToggle>
      )}
    >
      <SelectList>
        {STATES.map((state) => (
          <SelectOption
            hasCheckbox
            isSelected={selectedFilterType.includes(state)}
            key={state}
            value={state}
          >
            <EnactmentStateIcon status={state} />
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

export default EnactmentStateFilter;
