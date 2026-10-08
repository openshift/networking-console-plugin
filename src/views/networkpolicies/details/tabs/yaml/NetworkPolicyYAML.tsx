import React, { FC, Suspense } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';
import { NetworkPolicy } from '@utils/types/k8sTypes';

type NetworkPolicyYAMLPageProps = {
  obj?: NetworkPolicy;
};

const NetworkPolicyYAMLPage: FC<NetworkPolicyYAMLPageProps> = ({ obj: networkPolicy }) => {
  return (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={networkPolicy} />
    </Suspense>
  );
};

export default NetworkPolicyYAMLPage;
