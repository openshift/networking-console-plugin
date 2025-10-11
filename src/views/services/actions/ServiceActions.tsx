import React, { FC } from 'react';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';

import useServiceActions from './hooks/useServiceActions';

type ServiceActionsProps = {
  isKebabToggle?: boolean;
  obj: IoK8sApiCoreV1Service;
};

const ServiceActions: FC<ServiceActionsProps> = ({ isKebabToggle, obj }) => {
  const [actions] = useServiceActions(obj);

  return <ActionsDropdown actions={actions} id="service-actions" isKebabToggle={isKebabToggle} />;
};

export default ServiceActions;
