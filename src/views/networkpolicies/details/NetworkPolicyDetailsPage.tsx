import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import {
  HorizontalNav,
  K8sModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';

import NetworkPolicyPageTitle from './components/NetworkPolicyDetailsPageTitle';
import { useNetworkPolicyTabs } from './hooks/useNetworkPolicyTabs';

export type NetworkPolicyPageNavProps = {
  kindObj: K8sModel;
  name: string;
  namespace: string;
};

const NetworkPolicyDetailsPage: FC<NetworkPolicyPageNavProps> = ({ kindObj, name, namespace }) => {
  const [networkPolicy, loaded, error] = useK8sWatchResource<IoK8sApiNetworkingV1NetworkPolicy>({
    groupVersionKind: modelToGroupVersionKind(kindObj),
    name,
    namespace,
  });
  const pages = useNetworkPolicyTabs();

  return (
    <StatusBox error={error} loaded={loaded}>
      <NetworkPolicyPageTitle networkPolicy={networkPolicy} />
      <HorizontalNav pages={pages} resource={networkPolicy} />
    </StatusBox>
  );
};

export default NetworkPolicyDetailsPage;
