import React, { FC, Ref, useState } from 'react';

import {
  Content,
  ContentVariants,
  Divider,
  Dropdown,
  DropdownItem,
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
import { DisplayOptionsState, TopologyGroupType } from '@views/topology/types';
import {
  TOPOLOGY_GROUP_ORDER,
  TOPOLOGY_SCOPE_ORDER,
  TopologyLayoutType,
  TopologyViewTypes,
} from '@views/topology/utils/constants';

import './DisplayOptionsDropdown.scss';

type DisplayOptionsDropdownProps = {
  displayOptions: DisplayOptionsState;
  group: TopologyGroupType;
  layout: TopologyLayoutType;
  onDisplayOptionsChange: (options: DisplayOptionsState) => void;
  onGroupChange: (group: TopologyGroupType) => void;
  onLayoutChange: (layout: TopologyLayoutType) => void;
  onScopeChange: (scope: TopologyViewTypes) => void;
  scope: TopologyViewTypes;
};

interface LayoutOption {
  description: string;
  label: string;
  type: TopologyLayoutType;
}

const DisplayOptionsDropdown: FC<DisplayOptionsDropdownProps> = ({
  displayOptions,
  group,
  layout,
  onDisplayOptionsChange,
  onGroupChange,
  onLayoutChange,
  onScopeChange,
  scope,
}) => {
  const { t } = useNetworkingTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'group' | 'scope' | undefined>();

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
  const scopeLabel = (value: TopologyGroupType | TopologyViewTypes) => {
    switch (value) {
      case TopologyViewTypes.network:
        return t('Network');
      case TopologyViewTypes.owner:
        return t('Owner');
      case TopologyViewTypes.namespace:
        return t('Namespace');
      case TopologyViewTypes.resource:
        return t('Resource');
      case TopologyGroupType.namespaceOwner:
        return t('Namespace + Owner');
      case TopologyGroupType.none:
        return t('None');
    }
  };

  const groupOptions = TOPOLOGY_GROUP_ORDER.filter((value) => {
    if (value === TopologyGroupType.none) return true;
    if (
      (scope === TopologyViewTypes.namespace || scope === TopologyViewTypes.network) &&
      value === TopologyGroupType.owner
    ) {
      return false;
    }
    if (scope !== TopologyViewTypes.resource && value === TopologyGroupType.namespaceOwner) {
      return false;
    }
    return value !== scope;
  });

  return (
    <Select
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
      }}
      onSelect={(_event, value) => {
        if (
          typeof value === 'string' &&
          Object.values(TopologyLayoutType).includes(value as TopologyLayoutType)
        ) {
          onLayoutChange(value as TopologyLayoutType);
          setIsOpen(true);
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
        <div className="networking-topology__scope-group-row">
          <div className="networking-topology__scope-group-item">
            <SelectGroup label={t('Scope')}>
              <div className="networking-topology__display-option-dropdown">
                <Dropdown
                  isOpen={openDropdown === 'scope'}
                  onOpenChange={(open) => setOpenDropdown(open ? 'scope' : undefined)}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      className="networking-topology__scope-group-toggle"
                      isExpanded={openDropdown === 'scope'}
                      onClick={() =>
                        setOpenDropdown(openDropdown === 'scope' ? undefined : 'scope')
                      }
                      ref={toggleRef}
                    >
                      {t(scopeLabel(scope))}
                    </MenuToggle>
                  )}
                >
                  {TOPOLOGY_SCOPE_ORDER.map((value) => (
                    <DropdownItem
                      isSelected={scope === value}
                      key={value}
                      onClick={(event) => {
                        event.stopPropagation();
                        onScopeChange(value);
                        setOpenDropdown(undefined);
                        setIsOpen(true);
                      }}
                    >
                      {t(scopeLabel(value))}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
            </SelectGroup>
          </div>
          <div className="networking-topology__scope-group-item">
            <SelectGroup label={t('Groups')}>
              <div className="networking-topology__display-option-dropdown">
                <Dropdown
                  isOpen={openDropdown === 'group'}
                  onOpenChange={(open) => setOpenDropdown(open ? 'group' : undefined)}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      className="networking-topology__scope-group-toggle"
                      isDisabled={groupOptions.length === 1}
                      isExpanded={openDropdown === 'group'}
                      onClick={() =>
                        setOpenDropdown(openDropdown === 'group' ? undefined : 'group')
                      }
                      ref={toggleRef}
                    >
                      {t(scopeLabel(group))}
                    </MenuToggle>
                  )}
                >
                  {groupOptions.map((value) => (
                    <DropdownItem
                      isSelected={group === value}
                      key={value}
                      onClick={(event) => {
                        event.stopPropagation();
                        onGroupChange(value);
                        setOpenDropdown(undefined);
                        setIsOpen(true);
                      }}
                    >
                      {t(scopeLabel(value))}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
            </SelectGroup>
          </div>
        </div>
        <Divider />
        <SelectGroup label={t('Visibility')}>
          <SelectOption key="show-labels" value="show-labels">
            <Switch
              id="display-opt-show-labels"
              isChecked={displayOptions.showLabels}
              label={t('Show labels')}
              onChange={(_event, checked) => updateOption('showLabels', checked)}
              onClick={(event) => event.stopPropagation()}
            />
          </SelectOption>
          <SelectOption key="hide-management-ports" value="hide-management-ports">
            <Switch
              id="display-opt-hide-management-ports"
              isChecked={displayOptions.hideManagementPorts}
              label={t('Hide management ports')}
              onChange={(_event, checked) => updateOption('hideManagementPorts', checked)}
              onClick={(event) => event.stopPropagation()}
            />
          </SelectOption>
          <SelectOption key="hide-workloads" value="hide-workloads">
            <Switch
              id="display-opt-hide-workloads"
              isChecked={displayOptions.hideWorkloads}
              label={t('Hide workloads')}
              onChange={(_event, checked) => updateOption('hideWorkloads', checked)}
              onClick={(event) => event.stopPropagation()}
            />
          </SelectOption>
          <SelectOption key="compact-view" value="compact-view">
            <Switch
              id="display-opt-compact-view"
              isChecked={displayOptions.compactView}
              label={t('Compact view')}
              onChange={(_event, checked) => updateOption('compactView', checked)}
              onClick={(event) => event.stopPropagation()}
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
