import React, { FC, Suspense } from 'react';

import { IoK8sApiNetworkingV1IngressSpec } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';

type IngressYAMLTabProps = {
  obj: IoK8sApiNetworkingV1IngressSpec;
};

const IngressYAMLTab: FC<IngressYAMLTabProps> = ({ obj: ingress }) => {
  if (!ingress) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={ingress} />
    </Suspense>
  );
};

export default IngressYAMLTab;
