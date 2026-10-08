import React, { FC, Suspense } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';
import { IngressSpec } from '@utils/types/k8sTypes';

type IngressYAMLTabProps = {
  obj: IngressSpec;
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
