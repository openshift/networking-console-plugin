import React, { Ref } from 'react';

import { MenuToggle, MenuToggleElement, MenuToggleProps } from '@patternfly/react-core';

type SelectToggleProps = {
  selected: any;
} & MenuToggleProps;

const SelectToggle = ({ selected, ...menuProps }: SelectToggleProps) =>
  function SToggle(toggleRef: Ref<MenuToggleElement>) {
    return (
      <MenuToggle ref={toggleRef} {...menuProps}>
        {selected}
      </MenuToggle>
    );
  };

export default SelectToggle;
