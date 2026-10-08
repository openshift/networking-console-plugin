import React, { FC } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { getGroupVersionKindForModel, RouteModel } from '@utils/models';
import { RouteKind } from '@utils/types';

import RouteFormPage from '../form/RouteFormPage';

const RouteDetailsPage: FC = () => {
  const params = useParams();

  const [route, loaded, error] = useK8sWatchResource<RouteKind>({
    groupVersionKind: getGroupVersionKindForModel(RouteModel),
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
