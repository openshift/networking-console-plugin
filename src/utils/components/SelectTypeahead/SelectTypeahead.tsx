import React, { FC, ReactNode, Ref, useRef, useState } from 'react';

import {
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import Toggle from './Toggle';
import { filterOptions } from './utils';

type SelectTypeaheadProps = {
  canCreate?: boolean;
  id: string;
  newOptionComponent?: (inputValue: string) => ReactNode;
  options: SelectOptionProps[];
  placeholder?: string;
  selected: string;
  setSelected: (newSelection: null | string) => void;
};

const SelectTypeahead: FC<SelectTypeaheadProps> = ({
  canCreate = false,
  id,
  newOptionComponent,
  options,
  placeholder,
  selected,
  setSelected,
}) => {
  const { t } = useNetworkingTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(selected || '');
  const [filterValue, setFilterValue] = useState<string>('');
  const [focusedItemIndex, setFocusedItemIndex] = useState<null | number>(null);
  const textInputRef = useRef<HTMLInputElement>();

  const selectOptions = filterValue ? filterOptions(options, filterValue) : options;

  const onSelect = (value: string) => {
    if (value) {
      setSelected(value);

      setInputValue(value);
      if (selected === value) {
        setFilterValue('');
      }

      setIsOpen(false);
    }

    textInputRef.current?.focus();
  };

  const resetInputToSelectedOption = () => {
    if (inputValue && inputValue !== selected) {
      setInputValue(selected ?? '');
      setFilterValue('');
    }
  };

  return (
    <Select
      id={id}
      isOpen={isOpen}
      isScrollable
      onOpenChange={() => {
        setIsOpen(false);
        resetInputToSelectedOption();
      }}
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
          setInputValue={(newInput) => {
            setInputValue(newInput);
            setFilterValue(newInput);
            if (!newInput) setSelected(null);
          }}
          setIsOpen={setIsOpen}
          setSelected={setSelected}
          textInputRef={textInputRef}
          toggleRef={toggleRef}
        />
      )}
    >
      <SelectList id="select-typeahead-listbox">
        {selectOptions.map((option, index) => (
          <SelectOption
            className={option.className}
            id={`select-typeahead-${option.value.replace(' ', '-')}`}
            isFocused={focusedItemIndex === index}
            key={option.value || option.children}
            {...option}
          >
            {option.children || option.value}
          </SelectOption>
        ))}
      </SelectList>
      {!isEmpty(inputValue) && canCreate && (
        <SelectOption selected={inputValue === selected} value={inputValue}>
          {newOptionComponent
            ? newOptionComponent(inputValue)
            : t(`Use "{{inputValue}}"`, { inputValue })}
        </SelectOption>
      )}
    </Select>
  );
};

export default SelectTypeahead;
