import React, { FC, JSX } from 'react';

import { DescriptionList as DL } from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

type UDNLayer2DetailsProps = {
  emptyText: JSX.Element;
  joinSubnets: JSX.Element;
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
  subnets: JSX.Element;
};

const UDNLayerDetails: FC<UDNLayer2DetailsProps> = ({ emptyText, joinSubnets, obj, subnets }) => {
  const { t } = useNetworkingTranslation();
  const layer2Path = obj.spec?.network ? 'spec.network.layer2' : 'spec.layer2';

  return (
    <DL>
      <DetailsItem
        defaultValue={emptyText}
        label={t('IPAM Lifecycle')}
        obj={obj}
        path={`${layer2Path}.ipam.lifecycle`}
      />
      <DetailsItem defaultValue={emptyText} label={t('MTU')} obj={obj} path={`${layer2Path}.mtu`} />
      <DetailsItem
        defaultValue={emptyText}
        label={t('Role')}
        obj={obj}
        path={`${layer2Path}.role`}
      />
      <DetailsItem
        defaultValue={emptyText}
        label={t('Subnets')}
        obj={obj}
        path={`${layer2Path}.subnets"`}
      >
        {subnets}
      </DetailsItem>
      <DetailsItem
        defaultValue={emptyText}
        label={t('JoinSubnets')}
        obj={obj}
        path={`${layer2Path}.joinSubnets`}
      >
        {joinSubnets}
      </DetailsItem>
    </DL>
  );
};

export default UDNLayerDetails;
