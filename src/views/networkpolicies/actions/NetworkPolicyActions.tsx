import React, { FC } from 'react';

import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';

import useNetworkPolicyActions from './hooks/useNetworkPolicyActions';

type NetworkPolicyActionsProps = {
  isKebabToggle?: boolean;
  obj: IoK8sApiNetworkingV1NetworkPolicy;
};

const NetworkPolicyActions: FC<NetworkPolicyActionsProps> = ({ isKebabToggle, obj }) => {
  const [actions] = useNetworkPolicyActions(obj);

  return (
    <ActionsDropdown
      actions={actions}
      id="virtual-machine-instance-migration-actions"
      isKebabToggle={isKebabToggle}
    />
  );
};

export default NetworkPolicyActions;
