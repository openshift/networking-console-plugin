import React, { FC } from 'react';

import { modelToGroupVersionKind, RouteModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { RouteKind } from '@utils/types';
import RouteDetailsPageTitle from '@views/routes/details/components/RouteDetailsPageTitle/RouteDetailsPageTitle';
import useRouteTabs from '@views/routes/details/hooks/useRouteTabs';

type RouteDetailsPageProps = {
  name: string;
  namespace: string;
};

const RouteDetailsPage: FC<RouteDetailsPageProps> = ({ name, namespace }) => {
  const [route, loaded, error] = useK8sWatchResource<RouteKind>({
    groupVersionKind: modelToGroupVersionKind(RouteModel),
    name,
    namespace: namespace,
  });

  const pages = useRouteTabs();

  return (
    <StatusBox error={error} loaded={loaded}>
      <RouteDetailsPageTitle route={route} />
      <HorizontalNav pages={pages} resource={route} />
    </StatusBox>
  );
};

export default RouteDetailsPage;
