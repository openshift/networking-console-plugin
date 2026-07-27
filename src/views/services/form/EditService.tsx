import React, { FC } from 'react';
import { useParams } from 'react-router';

import { modelToGroupVersionKind, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';

import ServiceFormPage from './ServiceFormPage';

const EditService: FC = () => {
  const params = useParams();

  const [service, loaded, error] = useK8sWatchResource<IoK8sApiCoreV1Service>({
    groupVersionKind: modelToGroupVersionKind(ServiceModel),
    isList: false,
    name: params.name,
    namespace: params.namespace,
  });

  return (
    <StatusBox error={error} loaded={loaded}>
      <ServiceFormPage initialService={service} />
    </StatusBox>
  );
};

export default EditService;
