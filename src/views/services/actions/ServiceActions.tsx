import React, { FC } from 'react';

import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { Service } from '@utils/types/k8sTypes';

import useServiceActions from './hooks/useServiceActions';

type ServiceActionsProps = {
  isKebabToggle?: boolean;
  obj: Service;
};

const ServiceActions: FC<ServiceActionsProps> = ({ isKebabToggle, obj }) => {
  const [actions] = useServiceActions(obj);

  return (
    <ActionsDropdown
      actions={actions}
      id="virtual-machine-instance-migration-actions"
      isKebabToggle={isKebabToggle}
    />
  );
};

export default ServiceActions;
