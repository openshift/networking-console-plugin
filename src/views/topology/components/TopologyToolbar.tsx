import React, { FC, Ref, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Label,
  LabelGroup,
  MenuFooter,
  MenuToggle,
  MenuToggleElement,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon, ListIcon, TopologyIcon } from '@patternfly/react-icons';
import { Model } from '@patternfly/react-topology';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import AdvancedFilterPopover from '@views/topology/components/AdvancedFilterPopover';
import DisplayOptionsDropdown from '@views/topology/components/DisplayOptionsDropdown';
import useTopologyFilters from '@views/topology/hooks/useTopologyFilters';
import { DisplayOptionsState, TopologyDisplayMode } from '@views/topology/types';
import { FilterMatchType, ResourceType, TopologyLayoutType } from '@views/topology/utils/constants';
import {
  attributeLabel,
  countNodesByResourceType,
  isResourceType,
  operatorLabel,
  resourceTypeLabel,
} from '@views/topology/utils/filterModel';

type TopologyToolbarProps = {
  displayMode: TopologyDisplayMode;
  displayOptions: DisplayOptionsState;
  layout: TopologyLayoutType;
  model: Model | undefined;
  onDisplayModeChange: (mode: TopologyDisplayMode) => void;
  onDisplayOptionsChange: (options: DisplayOptionsState) => void;
  onLayoutChange: (layout: TopologyLayoutType) => void;
};

const TopologyToolbar: FC<TopologyToolbarProps> = ({
  displayMode,
  displayOptions,
  layout,
  model,
  onDisplayModeChange,
  onDisplayOptionsChange,
  onLayoutChange,
}) => {
  const { t } = useNetworkingTranslation();
  const {
    advancedFilters,
    resourceTypes,
    searchQuery,
    setAdvancedFilters,
    setFilterMatchType,
    setResourceTypes,
    setSearchQuery,
  } = useTopologyFilters();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const options = useMemo(() => {
    const counts = countNodesByResourceType(model);

    return Object.values(ResourceType)
      .filter(isResourceType)
      .filter((type) => (counts.get(type) ?? 0) > 0)
      .map((type) => ({
        count: counts.get(type) ?? 0,
        label: resourceTypeLabel(t, type),
        type,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [model, t]);

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: number | string | undefined,
  ) => {
    if (!isResourceType(value)) {
      return;
    }

    const nextTypes = resourceTypes.includes(value)
      ? resourceTypes.filter((type) => type !== value)
      : [...resourceTypes, value];

    setResourceTypes(nextTypes);
    setIsFilterOpen(true);
  };

  const onRemoveFilter = (index: number) => {
    const next = advancedFilters.filter((_, i) => i !== index);
    setAdvancedFilters(next);
    if (next.length === 0) {
      setFilterMatchType(FilterMatchType.AND);
    }
  };

  const onClearAllFilters = () => {
    setAdvancedFilters([]);
    setFilterMatchType(FilterMatchType.AND);
  };

  return (
    <Toolbar id="networking-topology-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <Select
            id="topology-resource-type-filter"
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            onSelect={onSelect}
            popperProps={{ appendTo: () => document.body }}
            selected={resourceTypes}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                aria-label={t('Filter by...')}
                badge={
                  resourceTypes.length > 0 ? (
                    <Badge isRead>{resourceTypes.length}</Badge>
                  ) : undefined
                }
                data-test-id="topology-resource-filter"
                icon={<FilterIcon />}
                id="topology-resource-type-filter-toggle"
                isExpanded={isFilterOpen}
                onClick={() => setIsFilterOpen((open) => !open)}
                ref={toggleRef}
              >
                {t('Filter by...')}
              </MenuToggle>
            )}
          >
            <SelectList isAriaMultiselectable>
              {options.map((option) => (
                <SelectOption
                  hasCheckbox
                  isSelected={resourceTypes.includes(option.type)}
                  key={option.type}
                  value={option.type}
                >
                  {option.label} ({option.count})
                </SelectOption>
              ))}
            </SelectList>
            <MenuFooter>
              <Button
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setResourceTypes([]);
                }}
                type="button"
                variant="link"
              >
                {t('Clear all filters')}
              </Button>
            </MenuFooter>
          </Select>
        </ToolbarItem>
        <ToolbarItem>
          <SearchInput
            aria-label={t('Search topology...')}
            data-test-id="topology-search"
            onChange={(_event, value) => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            placeholder={t('Search topology...')}
            value={searchQuery}
          />
        </ToolbarItem>
        <ToolbarItem>
          <AdvancedFilterPopover />
        </ToolbarItem>
        <ToolbarGroup align={{ default: 'alignEnd' }}>
          <ToolbarItem>
            <DisplayOptionsDropdown
              displayOptions={displayOptions}
              layout={layout}
              onDisplayOptionsChange={onDisplayOptionsChange}
              onLayoutChange={onLayoutChange}
            />
          </ToolbarItem>
          <ToolbarItem>
            <ToggleGroup aria-label={t('Display mode')}>
              <ToggleGroupItem
                aria-label={t('Graph view')}
                buttonId="topology-display-graph"
                icon={<TopologyIcon />}
                isSelected={displayMode === TopologyDisplayMode.graph}
                onChange={() => onDisplayModeChange(TopologyDisplayMode.graph)}
              />
              <ToggleGroupItem
                aria-label={t('Table view')}
                buttonId="topology-display-table"
                icon={<ListIcon />}
                isSelected={displayMode === TopologyDisplayMode.table}
                onChange={() => onDisplayModeChange(TopologyDisplayMode.table)}
              />
            </ToggleGroup>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
      {advancedFilters.length > 0 && (
        <ToolbarContent>
          <ToolbarItem>
            <LabelGroup categoryName={t('Filters')} numLabels={10}>
              {advancedFilters.map((filter, index) => (
                <Label
                  key={`${filter.attribute}-${filter.operator}-${filter.value}-${index}`}
                  onClose={() => onRemoveFilter(index)}
                  variant="outline"
                >
                  {attributeLabel(t, filter.attribute)} {operatorLabel(t, filter.operator)} &quot;
                  {filter.value}&quot;
                </Label>
              ))}
            </LabelGroup>
          </ToolbarItem>
          <ToolbarItem>
            <Button data-test-id="advanced-filter-clear" onClick={onClearAllFilters} variant="link">
              {t('Clear filters')}
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      )}
    </Toolbar>
  );
};

export default TopologyToolbar;
