import React, { FC } from 'react';

import { Grid, GridItem, PageSection } from '@patternfly/react-core';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { Ingress } from '@utils/types/k8sTypes';
import IngressDetailsSection from '@views/ingresses/details/tabs/details/components/IngressDetailsSection/IngressDetailsSection';

import IngressRulesSection from './components/IngressRulesSection/IngressRulesSection';

type IngressDetailsTabProps = {
  obj: Ingress;
};

const IngressDetailsTab: FC<IngressDetailsTabProps> = ({ obj: ingress }) => {
  const { t } = useNetworkingTranslation();

  if (!ingress) return <Loading />;

  return (
    <>
      <PageSection>
        <DetailsSectionTitle titleText={t('{{kind}} details', { kind: ingress?.kind })} />
        <Grid span={6}>
          <GridItem>
            <IngressDetailsSection ingress={ingress} />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <IngressRulesSection ingress={ingress} />
      </PageSection>
    </>
  );
};

export default IngressDetailsTab;
