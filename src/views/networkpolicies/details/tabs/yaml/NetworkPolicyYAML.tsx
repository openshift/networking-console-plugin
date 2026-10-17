import React, { FC, Suspense } from 'react';

import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';

type NetworkPolicyYAMLPageProps = {
  obj?: IoK8sApiNetworkingV1NetworkPolicy;
};

const NetworkPolicyYAMLPage: FC<NetworkPolicyYAMLPageProps> = ({ obj: networkPolicy }) => {
  return (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={networkPolicy} />
    </Suspense>
  );
};

export default NetworkPolicyYAMLPage;
