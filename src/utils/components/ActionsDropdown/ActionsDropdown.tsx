import React, { FC, memo, useState } from 'react';

import { Action } from '@openshift-console/dynamic-plugin-sdk';
import { Dropdown, DropdownList } from '@patternfly/react-core';
import DropdownToggle from '@utils/components/Toggles/DropdownToggle';
import KebabToggle from '@utils/components/Toggles/KebabToggle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import ActionDropdownItem from '../ActionDropdownItem/ActionDropdownItem';

type ActionsDropdownProps = {
  actions: Action[];
  className?: string;
  id?: string;
  isDisabled?: boolean;
  isKebabToggle?: boolean;
  onLazyClick?: () => void;
};

const ActionsDropdown: FC<ActionsDropdownProps> = ({
  actions = [],
  className,
  id,
  isDisabled,
  isKebabToggle,
  onLazyClick,
}) => {
  const { t } = useNetworkingTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const onToggle = () => {
    setIsOpen((prevIsOpen) => {
      if (onLazyClick && !prevIsOpen) onLazyClick();

      return !prevIsOpen;
    });
  };

  const Toggle = isKebabToggle
    ? KebabToggle({ isExpanded: isOpen, onClick: onToggle })
    : DropdownToggle({
        children: t('Actions'),
        isDisabled,
        isExpanded: isOpen,
        onClick: onToggle,
      });

  return (
    <Dropdown
      className={className}
      data-test-id={id}
      isOpen={isOpen}
      onOpenChange={(open: boolean) => setIsOpen(open)}
      popperProps={{ enableFlip: true, position: 'right' }}
      toggle={Toggle}
    >
      <DropdownList>
        {actions?.map((action) => (
          <ActionDropdownItem action={action} key={action?.id} setIsOpen={setIsOpen} />
        ))}
      </DropdownList>
    </Dropdown>
  );
};

export default memo(ActionsDropdown);
