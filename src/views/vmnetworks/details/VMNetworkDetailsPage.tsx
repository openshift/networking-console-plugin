import React, { FC, useMemo } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { ClusterUserDefinedNetworkModelGroupVersionKind } from '@utils/models';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

import VMNetworkTitle from './components/VMNetworkTitle';

const VMNetworkDetailsPage: FC = () => {
  const { name } = useParams<{ name: string }>();
  const [vmNetwork, loaded, error] = useK8sWatchResource<ClusterUserDefinedNetworkKind>({
    groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
    isList: false,
    name: name,
    namespaced: false,
  });

  const pages = useMemo(
    () => [
      {
        component: React.lazy(() => import('./tabs/NetworkDetailPage')),
        href: '',
        name: 'Details',
      },
      {
        component: React.lazy(() => import('./tabs/NetworkYAMLPage')),
        href: 'yaml',
        name: 'YAML',
      },
    ],
    [],
  );

  return (
    <StatusBox error={error} loaded={loaded}>
      <VMNetworkTitle network={vmNetwork} />
      <HorizontalNav pages={pages} resource={vmNetwork} />
    </StatusBox>
  );
};

export default VMNetworkDetailsPage;
