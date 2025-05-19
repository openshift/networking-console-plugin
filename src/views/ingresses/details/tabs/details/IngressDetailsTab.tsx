import React, { FC } from 'react';

import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { Grid, GridItem, PageSection } from '@patternfly/react-core';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import IngressDetailsSection from '@views/ingresses/details/tabs/details/components/IngressDetailsSection/IngressDetailsSection';

import IngressRulesSection from './components/IngressRulesSection/IngressRulesSection';

type IngressDetailsTabProps = {
  obj: IoK8sApiNetworkingV1Ingress;
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
