import React, { FC, Ref, useCallback, useState } from 'react';

import {
  Button,
  Form,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Popover,
  Select,
  SelectList,
  SelectOption,
  TextInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import useTopologyFilters from '@views/topology/hooks/useTopologyFilters';
import { FilterAttribute, FilterMatchType, FilterOperator } from '@views/topology/utils/constants';
import {
  AdvancedFilter,
  attributeLabel,
  isDuplicateFilter,
  operatorLabel,
} from '@views/topology/utils/filterModel';

const AdvancedFilterPopover: FC = () => {
  const { t } = useNetworkingTranslation();
  const { advancedFilters, filterMatchType, setAdvancedFilters, setFilterMatchType } =
    useTopologyFilters();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [attribute, setAttribute] = useState<FilterAttribute>(FilterAttribute.Name);
  const [operator, setOperator] = useState<FilterOperator>(FilterOperator.Contains);
  const [value, setValue] = useState('');
  const [isAttributeOpen, setIsAttributeOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const isSelectOpen = isAttributeOpen || isOperatorOpen;

  const onAddFilter = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const newFilter: AdvancedFilter = { attribute, operator, value: trimmed };
    if (isDuplicateFilter(advancedFilters, newFilter)) {
      return;
    }
    setAdvancedFilters([...advancedFilters, newFilter]);
    setValue('');
  };

  const handleShouldClose = useCallback(
    (_event: KeyboardEvent | MouseEvent, hideFunction?: () => void) => {
      if (isSelectOpen) return;
      hideFunction?.();
      setIsPopoverOpen(false);
    },
    [isSelectOpen],
  );

  const bodyContent = (
    <div data-test-id="advanced-filter-body">
      <Form>
        <FormGroup fieldId="advanced-filter-attribute" label={t('Attribute')}>
          <Select
            id="advanced-filter-attribute"
            isOpen={isAttributeOpen}
            onOpenChange={setIsAttributeOpen}
            onSelect={(_event, val) => {
              setAttribute(val as FilterAttribute);
              setIsAttributeOpen(false);
            }}
            popperProps={{ appendTo: () => document.body }}
            selected={attribute}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                id="advanced-filter-attribute-toggle"
                isExpanded={isAttributeOpen}
                isFullWidth
                onClick={() => setIsAttributeOpen((open) => !open)}
                ref={toggleRef}
              >
                {attributeLabel(t, attribute)}
              </MenuToggle>
            )}
          >
            <SelectList>
              {Object.values(FilterAttribute).map((attr) => (
                <SelectOption isSelected={attribute === attr} key={attr} value={attr}>
                  {attributeLabel(t, attr)}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </FormGroup>

        <FormGroup fieldId="advanced-filter-operator" label={t('Operator')}>
          <Select
            id="advanced-filter-operator"
            isOpen={isOperatorOpen}
            onOpenChange={setIsOperatorOpen}
            onSelect={(_event, val) => {
              setOperator(val as FilterOperator);
              setIsOperatorOpen(false);
            }}
            popperProps={{ appendTo: () => document.body }}
            selected={operator}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                id="advanced-filter-operator-toggle"
                isExpanded={isOperatorOpen}
                isFullWidth
                onClick={() => setIsOperatorOpen((open) => !open)}
                ref={toggleRef}
              >
                {operatorLabel(t, operator)}
              </MenuToggle>
            )}
          >
            <SelectList>
              {Object.values(FilterOperator).map((op) => (
                <SelectOption isSelected={operator === op} key={op} value={op}>
                  {operatorLabel(t, op)}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </FormGroup>

        <FormGroup fieldId="advanced-filter-value" label={t('Value')}>
          <TextInput
            aria-label={t('Value')}
            data-test-id="advanced-filter-value"
            id="advanced-filter-value"
            onChange={(_event, val) => setValue(val)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onAddFilter();
              }
            }}
            placeholder={t('e.g. "openshift-storage"')}
            value={value}
          />
        </FormGroup>

        <FormGroup fieldId="advanced-filter-match-type">
          <ToggleGroup aria-label={t('Filter match type')}>
            <ToggleGroupItem
              buttonId="filter-match-and"
              isSelected={filterMatchType === FilterMatchType.AND}
              onChange={() => setFilterMatchType(FilterMatchType.AND)}
              text={t('AND')}
            />
            <ToggleGroupItem
              buttonId="filter-match-or"
              isSelected={filterMatchType === FilterMatchType.OR}
              onChange={() => setFilterMatchType(FilterMatchType.OR)}
              text={t('OR')}
            />
          </ToggleGroup>
        </FormGroup>

        <Button
          data-test-id="advanced-filter-add"
          isBlock
          isDisabled={!value.trim()}
          onClick={onAddFilter}
          variant="primary"
        >
          {t('Add filter')}
        </Button>
      </Form>
    </div>
  );

  return (
    <Popover
      bodyContent={bodyContent}
      data-test-id="advanced-filter-popover"
      hasAutoWidth
      headerContent={t('Advanced filter')}
      isVisible={isPopoverOpen}
      shouldClose={handleShouldClose}
      shouldOpen={(_event, showFunction) => {
        showFunction?.();
        setIsPopoverOpen(true);
      }}
      showClose
    >
      <Button data-test-id="advanced-filter-toggle" icon={<FilterIcon />} variant="secondary">
        {t('Advanced')}
      </Button>
    </Popover>
  );
};

export default AdvancedFilterPopover;
