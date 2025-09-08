import React, { FC } from 'react';

import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import VMNetworkAction from '@views/vmnetworks/actions/VMNetworkActions';
import { VM_NETWORKS_PATH } from '@views/vmnetworks/constants';

type VMNetworkTitleProps = {
  network: ClusterUserDefinedNetworkKind;
};

const VMNetworkTitle: FC<VMNetworkTitleProps> = ({ network }) => {
  const { t } = useNetworkingTranslation();

  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('VirtualMachine networks'), to: VM_NETWORKS_PATH },
        { name: t('VirtualMachine network details') },
      ]}
    >
      <Title headingLevel="h1">{getName(network)}</Title>
      <VMNetworkAction isKebabToggle={false} obj={network} />
    </DetailsPageTitle>
  );
};

export default VMNetworkTitle;
