import React, { FC } from 'react';

import { modelToGroupVersionKind, ServiceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';

import ServicePageTitle from './components/ServiceDetailsPageTitle';
import { useServiceTabs } from './hooks/useServiceTabs';

export type ServicePageNavProps = {
  name: string;
  namespace: string;
};

const ServicePageNav: FC<ServicePageNavProps> = ({ name, namespace }) => {
  const [service, loaded, error] = useK8sWatchResource<IoK8sApiCoreV1Service>({
    groupVersionKind: modelToGroupVersionKind(ServiceModel),
    name,
    namespace,
  });
  const pages = useServiceTabs();

  return (
    <StatusBox error={error} loaded={loaded}>
      <ServicePageTitle service={service} />
      <HorizontalNav pages={pages} resource={service} />
    </StatusBox>
  );
};

export default ServicePageNav;
