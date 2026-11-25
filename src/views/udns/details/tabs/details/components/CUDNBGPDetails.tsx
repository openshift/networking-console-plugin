import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Grid, GridItem, Label } from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRoutingModel } from '@utils/models';
import { BGPRouting } from '@utils/resources/bgp/types';
import { condition } from '@utils/resources/bgp/utils';
import { BGPStatus } from '@views/bgp/components/BGPStatus';

type CUDNBGPDetailsProps = {
  routings: BGPRouting[];
};

const CUDNBGPDetails: FC<CUDNBGPDetailsProps> = ({ routings }) => {
  const { t } = useNetworkingTranslation();

  return (
    <>
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('BGP routings')} />
      <Grid hasGutter>
        {routings.map((routing) => {
          const available = condition(routing.status?.conditions);

          return (
            <GridItem key={routing.metadata?.name} span={12}>
              <Grid hasGutter>
                <GridItem md={6}>
                  <Grid hasGutter>
                    <GridItem md={6}>
                      <DetailsItem label={t('Name')} obj={routing}>
                        <ResourceLink
                          groupVersionKind={modelToGroupVersionKind(BGPRoutingModel)}
                          name={routing.metadata?.name}
                        />
                      </DetailsItem>
                    </GridItem>
                    <GridItem md={6}>
                      <DetailsItem label={t('Network')} obj={routing}>
                        {routing.spec?.network?.name || t('Unknown')}
                      </DetailsItem>
                    </GridItem>
                  </Grid>
                </GridItem>
                <GridItem md={6}>
                  <Grid hasGutter>
                    <GridItem md={6}>
                      <DetailsItem label={t('Phase')} obj={routing}>
                        <BGPStatus condition={available} phase={routing.status?.phase} />
                      </DetailsItem>
                    </GridItem>
                    <GridItem md={6}>
                      <DetailsItem label={t('Availability')} obj={routing}>
                        <Label color={available?.status === 'True' ? 'green' : 'red'}>
                          {available?.status || t('Unknown')}
                        </Label>
                      </DetailsItem>
                    </GridItem>
                  </Grid>
                </GridItem>
              </Grid>
            </GridItem>
          );
        })}
      </Grid>
    </>
  );
};

export default CUDNBGPDetails;
