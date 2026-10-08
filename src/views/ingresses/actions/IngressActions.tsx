import React, { FC } from 'react';

import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { Ingress } from '@utils/types/k8sTypes';
import useIngressActions from '@views/ingresses/actions/hooks/useIngressActions';

type IngressActionsProps = {
  ingress: Ingress;
  isKebabToggle?: boolean;
};

const IngressActions: FC<IngressActionsProps> = ({ ingress, isKebabToggle }) => {
  const [actions] = useIngressActions(ingress);

  return <ActionsDropdown actions={actions} id="ingress-actions" isKebabToggle={isKebabToggle} />;
};

export default IngressActions;
