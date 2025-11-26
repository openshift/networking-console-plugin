import React, { FC, Suspense } from 'react';

import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui/kubevirt-api/kubernetes/models/IoK8sApiNetworkingV1Ingress';
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';

type IngressYAMLTabProps = {
  obj: IoK8sApiNetworkingV1Ingress;
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
