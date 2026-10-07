import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { IngressModel } from '@utils/models';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import IngressDetailsPageTitle from '@views/ingresses/details/components/IngressDetailsPageTitle';
import useIngressTabs from '@views/ingresses/details/hooks/useIngressTabs';

type IngressDetailsPageProps = {
  name: string;
  namespace: string;
};

const IngressDetailsPage: FC<IngressDetailsPageProps> = ({ name, namespace }) => {
  const [ingress, loaded, error] = useK8sWatchResource<IoK8sApiNetworkingV1Ingress>({
    groupVersionKind: modelToGroupVersionKind(IngressModel),
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
