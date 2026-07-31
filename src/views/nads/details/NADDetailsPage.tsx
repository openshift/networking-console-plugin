import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';

import NADDetailsPageTitle from './components/NADDetailsPageTitle';
import { useNADTabs } from './hooks/useNADTabs';
import useNADVirtualMachines from './hooks/useNADVirtualMachines';

export type NADDetailsPageProps = {
  name: string;
  namespace: string;
};

const NADDetailsPage: FC<NADDetailsPageProps> = ({ name, namespace }) => {
  const [nad, loaded, error] = useK8sWatchResource<NetworkAttachmentDefinitionKind>({
    groupVersionKind: modelToGroupVersionKind(NetworkAttachmentDefinitionModel),
    name,
    namespace,
  });
  const { virtualMachines } = useNADVirtualMachines(nad);
  const pages = useNADTabs(virtualMachines.length);

  return (
    <StatusBox error={error} loaded={loaded}>
      <NADDetailsPageTitle nad={nad} />
      <HorizontalNav pages={pages} resource={nad} />
    </StatusBox>
  );
};

export default NADDetailsPage;
