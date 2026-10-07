import React, { FC } from 'react';

import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import useIngressActions from '@views/ingresses/actions/hooks/useIngressActions';

type IngressActionsProps = {
  ingress: IoK8sApiNetworkingV1Ingress;
  isKebabToggle?: boolean;
};

const IngressActions: FC<IngressActionsProps> = ({ ingress, isKebabToggle }) => {
  const [actions] = useIngressActions(ingress);

  return <ActionsDropdown actions={actions} id="ingress-actions" isKebabToggle={isKebabToggle} />;
};

export default IngressActions;
