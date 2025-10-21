import React, { FC, Ref, useRef, useState } from 'react';

import {
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
} from '@patternfly/react-core';

import { NO_RESULTS_VALUE } from './constants';
import Toggle from './Toggle';
import { filterOptions } from './utils';

type SelectMultiTypeaheadProps = {
  options: SelectOptionProps[];
  placeholder?: string;
  selected: string[];
  setSelected: (newSelection: string[]) => void;
};

const SelectMultiTypeahead: FC<SelectMultiTypeaheadProps> = ({
  options,
  placeholder,
  selected,
  setSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [focusedItemIndex, setFocusedItemIndex] = useState<null | number>(null);
  const textInputRef = useRef<HTMLInputElement>();

  const selectOptions = inputValue ? filterOptions(options, inputValue) : options;

  const onSelect = (value: string) => {
    if (value && value !== NO_RESULTS_VALUE) {
      setSelected(
        selected?.includes(value)
          ? selected.filter((selection) => selection !== value)
          : [...(selected || []), value],
      );

      setIsOpen(true);
    }

    textInputRef.current?.focus();
  };

  return (
    <Select
      id="multi-typeahead-select"
      isOpen={isOpen}
      isScrollable
      onOpenChange={() => setIsOpen(false)}
      onSelect={(ev, selection) => onSelect(selection as string)}
      selected={selected}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <Toggle
          focusedItemIndex={focusedItemIndex}
          inputValue={inputValue}
          isOpen={isOpen}
          onSelect={onSelect}
          placeholder={placeholder}
          selected={selected}
          selectOptions={selectOptions}
          setFocusedItemIndex={setFocusedItemIndex}
          setInputValue={setInputValue}
          setIsOpen={setIsOpen}
          setSelected={setSelected}
          textInputRef={textInputRef}
          toggleRef={toggleRef}
        />
      )}
    >
      <SelectList id="select-multi-typeahead-listbox" isAriaMultiselectable>
        {selectOptions.map((option, index) => (
          <SelectOption
            className={option.className}
            id={`select-multi-typeahead-${option.value.replace(' ', '-')}`}
            isFocused={focusedItemIndex === index}
            isSelected={selected?.includes(option.value)}
            key={option.value || option.children}
            {...option}
          >
            {option.children || option.value}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

export default SelectMultiTypeahead;
