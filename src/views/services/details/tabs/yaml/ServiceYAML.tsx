import React, { FC, Suspense } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';
import { Service } from '@utils/types/k8sTypes';

type ServiceYAMLPageProps = {
  obj?: Service;
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
