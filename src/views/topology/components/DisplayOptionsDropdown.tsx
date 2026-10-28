import React, { FC, Ref, useState } from 'react';

import {
  Content,
  ContentVariants,
  Divider,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  Radio,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  Switch,
} from '@patternfly/react-core';
import { SlidersHIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { DisplayOptionsState } from '@views/topology/types';
import { TopologyLayoutType } from '@views/topology/utils/constants';

type DisplayOptionsDropdownProps = {
  displayOptions: DisplayOptionsState;
  layout: TopologyLayoutType;
  onDisplayOptionsChange: (options: DisplayOptionsState) => void;
  onLayoutChange: (layout: TopologyLayoutType) => void;
};

interface LayoutOption {
  description: string;
  label: string;
  type: TopologyLayoutType;
}

const DisplayOptionsDropdown: FC<DisplayOptionsDropdownProps> = ({
  displayOptions,
  layout,
  onDisplayOptionsChange,
  onLayoutChange,
}) => {
  const { t } = useNetworkingTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const layoutOptions: LayoutOption[] = [
    {
      description: t('Compact left-to-right layers ranked by connections.'),
      label: t('Hierarchical'),
      type: TopologyLayoutType.Dagre,
    },
    {
      description: t('Compact top-down hierarchy.'),
      label: t('Tree'),
      type: TopologyLayoutType.BreadthFirst,
    },
    {
      description: t('Logical networks above worker grid with workloads below.'),
      label: t('Cluster map'),
      type: TopologyLayoutType.Levels,
    },
    {
      description: t('Resources in a grid inside each group; groups packed in rows.'),
      label: t('Grid'),
      type: TopologyLayoutType.Grid,
    },
    {
      description: t('Rings ordered by how connected each resource is.'),
      label: t('Radial'),
      type: TopologyLayoutType.Concentric,
    },
    {
      description: t('d3-force simulation: connected nodes attract each other.'),
      label: t('Force'),
      type: TopologyLayoutType.Force,
    },
    {
      description: t('WebCola physics layout: related nodes pull together.'),
      label: t('Cola'),
      type: TopologyLayoutType.Cola,
    },
  ];

  const updateOption = (key: keyof DisplayOptionsState, value: boolean) => {
    onDisplayOptionsChange({ ...displayOptions, [key]: value });
  };

  const onToggle = () => setIsOpen((prev) => !prev);

  return (
    <Select
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(_event, value) => {
        if (
          typeof value === 'string' &&
          Object.values(TopologyLayoutType).includes(value as TopologyLayoutType)
        ) {
          onLayoutChange(value as TopologyLayoutType);
        }
      }}
      popperProps={{ appendTo: () => document.body, position: 'end' }}
      selected={layout}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          aria-label={t('Display options')}
          data-test-id="topology-display-options"
          icon={<SlidersHIcon />}
          isExpanded={isOpen}
          onClick={onToggle}
          ref={toggleRef}
        >
          {t('Display options')}
        </MenuToggle>
      )}
    >
      <SelectList>
        <SelectGroup label={t('Visibility')}>
          <SelectOption isDisabled key="show-labels" value="show-labels">
            <Switch
              id="display-opt-show-labels"
              isChecked={displayOptions.showLabels}
              label={t('Show labels')}
              onChange={(_event, checked) => updateOption('showLabels', checked)}
            />
          </SelectOption>
          <SelectOption isDisabled key="hide-management-ports" value="hide-management-ports">
            <Switch
              id="display-opt-hide-management-ports"
              isChecked={displayOptions.hideManagementPorts}
              label={t('Hide management ports')}
              onChange={(_event, checked) => updateOption('hideManagementPorts', checked)}
            />
          </SelectOption>
          <SelectOption isDisabled key="hide-workloads" value="hide-workloads">
            <Switch
              id="display-opt-hide-workloads"
              isChecked={displayOptions.hideWorkloads}
              label={t('Hide workloads')}
              onChange={(_event, checked) => updateOption('hideWorkloads', checked)}
            />
          </SelectOption>
          <SelectOption isDisabled key="compact-view" value="compact-view">
            <Switch
              id="display-opt-compact-view"
              isChecked={displayOptions.compactView}
              label={t('Compact view')}
              onChange={(_event, checked) => updateOption('compactView', checked)}
            />
          </SelectOption>
        </SelectGroup>
        <Divider />
        <SelectGroup label={t('Layout')}>
          {layoutOptions.map((option) => (
            <SelectOption key={option.type} value={option.type}>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
                <FlexItem>
                  <Radio
                    id={`layout-radio-${option.type}`}
                    isChecked={layout === option.type}
                    label={option.label}
                    name="topology-layout"
                    onChange={() => onLayoutChange(option.type)}
                  />
                </FlexItem>
                <FlexItem>
                  <Content component={ContentVariants.small}>{option.description}</Content>
                </FlexItem>
              </Flex>
            </SelectOption>
          ))}
        </SelectGroup>
      </SelectList>
    </Select>
  );
};

export default DisplayOptionsDropdown;
