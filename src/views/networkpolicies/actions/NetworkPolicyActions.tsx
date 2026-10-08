import React, { FC } from 'react';

import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { NetworkPolicy } from '@utils/types/k8sTypes';

import useNetworkPolicyActions from './hooks/useNetworkPolicyActions';

type NetworkPolicyActionsProps = {
  isKebabToggle?: boolean;
  obj: NetworkPolicy;
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
