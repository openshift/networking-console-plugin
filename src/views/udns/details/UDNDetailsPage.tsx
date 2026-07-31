import React, { FC } from 'react';

import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import {
  ClusterUserDefinedNetworkModelGroupVersionKind,
  UserDefinedNetworkModelGroupVersionKind,
} from '@utils/models';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

import UDNDetailsPageTitle from './components/UDNDetailsPageTitle';
import { useUDNTabs } from './hooks/useUDNTabs';
import useUDNVirtualMachines from './hooks/useUDNVirtualMachines';

export type UDNDetailsPageProps = {
  name: string;
  namespace?: string;
};

const UDNDetailsPage: FC<UDNDetailsPageProps> = ({ name, namespace }) => {
  const isNamespaced = Boolean(namespace);

  const [udn, loaded, error] = useK8sWatchResource<
    ClusterUserDefinedNetworkKind | UserDefinedNetworkKind
  >({
    groupVersionKind: isNamespaced
      ? UserDefinedNetworkModelGroupVersionKind
      : ClusterUserDefinedNetworkModelGroupVersionKind,
    name,
    namespace,
  });

  const { virtualMachines } = useUDNVirtualMachines(udn);
  const pages = useUDNTabs(virtualMachines.length);

  return (
    <StatusBox error={error} loaded={loaded}>
      <UDNDetailsPageTitle udn={udn} />
      <HorizontalNav pages={pages} resource={udn} />
    </StatusBox>
  );
};

export default UDNDetailsPage;
