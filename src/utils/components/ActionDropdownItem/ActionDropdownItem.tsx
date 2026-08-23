import React, { Dispatch, FC, SetStateAction } from 'react';
import classNames from 'classnames';

import { Action, useAccessReview } from '@openshift-console/dynamic-plugin-sdk';
import { DropdownItem, TooltipPosition } from '@patternfly/react-core';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import './action-dropdown-item.scss';

type ActionDropdownItemProps = {
  action: Action;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

const ActionDropdownItem: FC<ActionDropdownItemProps> = ({ action, setIsOpen }) => {
  const { t } = useNetworkingTranslation();
  const [actionAllowed] = useAccessReview(action?.accessReview || {});
  const isCloneDisabled = !actionAllowed && action?.id === 'vm-action-clone';

  const handleClick = () => {
    if (typeof action?.cta === 'function') {
      action?.cta();
      setIsOpen(false);
    }
  };

  return (
    <DropdownItem
      data-test={action?.id}
      data-test-id={`${action?.id}`}
      description={action?.description}
      isDisabled={action?.disabled || !actionAllowed}
      key={action?.id}
      onClick={handleClick}
      {...(isCloneDisabled && {
        tooltipProps: {
          content: t(`You don't have permission to perform this action`),
          position: TooltipPosition.left,
        },
      })}
      className={classNames('networking-action-dropdown-item', {
        'networking-action-dropdown-item__disabled': isCloneDisabled,
      })}
    >
      {action?.label}
      {action?.icon && (
        <>
          {' '}
          <MutedText content={action.icon} isSpan />
        </>
      )}
    </DropdownItem>
  );
};

export default ActionDropdownItem;
