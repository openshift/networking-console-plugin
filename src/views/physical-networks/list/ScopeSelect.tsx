import React, { FC, Ref, useState } from 'react';

import { Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { ALL_NAMESPACES } from '@utils/constants';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import useProjects from '@utils/hooks/useProjects/useProjects';
import { getName } from '@utils/resources/shared';

type ScopeSelectProps = {
  onChange: (scope: string) => void;
  scope: string;
};

const ScopeSelect: FC<ScopeSelectProps> = ({ onChange, scope }) => {
  const { t } = useNetworkingTranslation();
  const [projects, projectsLoaded] = useProjects();
  const [isOpen, setIsOpen] = useState(false);

  const projectNames = (projects || []).map(getName).filter(Boolean);
  const selectedLabel = scope === ALL_NAMESPACES ? t('All projects') : scope;

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(event) => {
        event?.preventDefault();
        setIsOpen(false);
      }}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          data-test-id="physical-networks-scope-select"
          isDisabled={!projectsLoaded}
          isExpanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          ref={toggleRef}
        >
          {selectedLabel}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem isSelected={scope === ALL_NAMESPACES} onClick={() => onChange(ALL_NAMESPACES)}>
          {t('All projects')}
        </DropdownItem>
        {projectNames.map((projectName) => (
          <DropdownItem
            isSelected={scope === projectName}
            key={projectName}
            onClick={() => onChange(projectName)}
          >
            {projectName}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};

export default ScopeSelect;
