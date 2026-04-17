import React, { FC } from 'react';
import { useParams } from 'react-router';

import { modelToGroupVersionKind, RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { RouteKind } from '@utils/types';

import RouteFormPage from '../form/RouteFormPage';

const RouteDetailsPage: FC = () => {
  const params = useParams();

  const [route, loaded, error] = useK8sWatchResource<RouteKind>({
    groupVersionKind: modelToGroupVersionKind(RouteModel),
    isList: false,
    name: params.name,
    namespace: params.namespace,
  });

  return (
    <StatusBox error={error} loaded={loaded}>
      <RouteFormPage initialRoute={route} />
    </StatusBox>
  );
};

export default RouteDetailsPage;
