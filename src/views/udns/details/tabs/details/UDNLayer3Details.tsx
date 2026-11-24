import React, { FC, JSX } from 'react';

import { DescriptionList as DL, Grid, GridItem } from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

type UDNLayer3DetailsProps = {
  emptyText: JSX.Element;
  joinSubnets: JSX.Element;
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
  subnets: JSX.Element;
};

const UDNLayer3Details: FC<UDNLayer3DetailsProps> = ({ emptyText, joinSubnets, obj, subnets }) => {
  const { t } = useNetworkingTranslation();
  const layer3Path = obj.spec?.network ? 'spec.network.layer3' : 'spec.layer3';

  return (
    <>
      <Grid hasGutter>
        <GridItem md={6}>
          <DL>
            <DetailsItem
              defaultValue={emptyText}
              label={t('MTU')}
              obj={obj}
              path={`${layer3Path}.mtu`}
            />
          </DL>
        </GridItem>
        <GridItem md={6}>
          <DL>
            <DetailsItem
              defaultValue={emptyText}
              label={t('Role')}
              obj={obj}
              path={`${layer3Path}.role`}
            />
          </DL>
        </GridItem>
      </Grid>
      <Grid hasGutter>
        <GridItem md={6}>
          <DL>
            <DetailsItem
              defaultValue={emptyText}
              label={t('Subnets')}
              obj={obj}
              path={`${layer3Path}.subnets`}
            >
              {subnets}
            </DetailsItem>
          </DL>
        </GridItem>
        <GridItem md={6}>
          <DL>
            <DetailsItem
              defaultValue={emptyText}
              label={t('JoinSubnets')}
              obj={obj}
              path={`${layer3Path}.joinSubnets`}
            >
              {joinSubnets}
            </DetailsItem>
          </DL>
        </GridItem>
      </Grid>
    </>
  );
};

export default UDNLayer3Details;
