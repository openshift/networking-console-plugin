import React, { FC } from 'react';

import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { getGroupVersionKindForModel, IngressModel } from '@utils/models';
import { Ingress } from '@utils/types/k8sTypes';
import IngressDetailsPageTitle from '@views/ingresses/details/components/IngressDetailsPageTitle';
import useIngressTabs from '@views/ingresses/details/hooks/useIngressTabs';

type IngressDetailsPageProps = {
  name: string;
  namespace: string;
};

const IngressDetailsPage: FC<IngressDetailsPageProps> = ({ name, namespace }) => {
  const [ingress, loaded, error] = useK8sWatchResource<Ingress>({
    groupVersionKind: getGroupVersionKindForModel(IngressModel),
    name,
    namespace,
  });
  const pages = useIngressTabs();

  return (
    <StatusBox error={error} loaded={loaded}>
      <IngressDetailsPageTitle ingress={ingress} />
      <HorizontalNav pages={pages} resource={ingress} />
    </StatusBox>
  );
};

export default IngressDetailsPage;
