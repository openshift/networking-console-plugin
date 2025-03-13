import React, {
  Dispatch,
  FC,
  FormEvent,
  KeyboardEvent,
  Ref,
  RefObject,
  SetStateAction,
} from 'react';

import {
  Label,
  LabelGroup,
  Button,
  ButtonVariant,
  MenuToggle,
  MenuToggleElement,
  SelectOptionProps,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core';

import { TimesIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import { NO_RESULTS_VALUE } from './constants';
import { handleMenuArrowKeys } from './utils';

type ToggleProps = {
  focusedItemIndex: null | number;
  inputValue: string;
  isOpen: boolean;
  onSelect: (value: string) => void;
  placeholder: string;
  selected: string[];
  selectOptions: SelectOptionProps[];
  setFocusedItemIndex: (newValue: null | number) => void;
  setInputValue: (newInput: string) => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setSelected: (newSelection: string[]) => void;
  textInputRef: RefObject<any>;
  toggleRef: Ref<MenuToggleElement>;
};

const Toggle: FC<ToggleProps> = ({
  focusedItemIndex,
  inputValue,
  isOpen,
  onSelect,
  placeholder,
  selected,
  selectOptions,
  setFocusedItemIndex,
  setInputValue,
  setIsOpen,
  setSelected,
  textInputRef,
  toggleRef,
}) => {
  const { t } = useNetworkingTranslation();

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const enabledMenuItems = selectOptions.filter((menuItem) => !menuItem.isDisabled);
    const [firstMenuItem] = enabledMenuItems;
    const focusedItem = focusedItemIndex ? enabledMenuItems?.[focusedItemIndex] : firstMenuItem;

    switch (event.key) {
      // Select the first available option
      case 'Enter':
        if (!isOpen) {
          setIsOpen((prevIsOpen) => !prevIsOpen);
          return;
        }

        if (isOpen && focusedItem.value !== NO_RESULTS_VALUE) {
          onSelect(focusedItem.value as string);
        }

        break;
      case 'Tab':
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();

        if (isOpen) {
          const indexToFocus = handleMenuArrowKeys(event.key, focusedItemIndex, selectOptions);

          if (indexToFocus !== null) setFocusedItemIndex(indexToFocus);
        }
        break;
    }
  };

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onTextInputChange = (_event: FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    setFocusedItemIndex(null);

    if (value) setIsOpen(true);
  };

  return (
    <MenuToggle
      innerRef={toggleRef}
      isExpanded={isOpen}
      isFullWidth
      onClick={onToggleClick}
      variant="typeahead"
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          aria-controls="select-multi-typeahead-listbox"
          autoComplete="off"
          id="multi-typeahead-select-input"
          innerRef={textInputRef}
          isExpanded={isOpen}
          onChange={onTextInputChange}
          onClick={onToggleClick}
          onKeyDown={onInputKeyDown}
          placeholder={isEmpty(selected) ? placeholder : null}
          role="combobox"
          value={inputValue}
        >
          <LabelGroup aria-label={t('Current selections')}>
            {selected?.map((selection, index) => (
              <Label
                variant="outline"
                key={index}
                onClose={(ev) => {
                  ev.stopPropagation();
                  onSelect(selection);
                }}
              >
                {selection}
              </Label>
            ))}
          </LabelGroup>
        </TextInputGroupMain>
        <TextInputGroupUtilities>
          {!isEmpty(selected) && (
            <Button
              icon={<TimesIcon aria-hidden />}
              aria-label={t('Clear input value')}
              onClick={() => {
                setInputValue('');
                setSelected([]);
                textInputRef?.current?.focus();
              }}
              variant={ButtonVariant.plain}
            />
          )}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );
};

export default Toggle;
