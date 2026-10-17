import React, { FC, Suspense } from 'react';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';

type ServiceYAMLPageProps = {
  obj?: IoK8sApiCoreV1Service;
};

const ServiceYAMLPage: FC<ServiceYAMLPageProps> = ({ obj: service }) => {
  return !service ? (
    <Loading />
  ) : (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={service} />
    </Suspense>
  );
};

export default ServiceYAMLPage;
