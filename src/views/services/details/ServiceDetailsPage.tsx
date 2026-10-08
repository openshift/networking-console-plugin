import React, { FC } from 'react';

import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { getGroupVersionKindForModel, ServiceModel } from '@utils/models';
import { Service } from '@utils/types/k8sTypes';

import ServicePageTitle from './components/ServiceDetailsPageTitle';
import { useServiceTabs } from './hooks/useServiceTabs';

export type ServicePageNavProps = {
  name: string;
  namespace: string;
};

const ServicePageNav: FC<ServicePageNavProps> = ({ name, namespace }) => {
  const [service, loaded, error] = useK8sWatchResource<Service>({
    groupVersionKind: getGroupVersionKindForModel(ServiceModel),
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
