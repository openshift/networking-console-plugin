import React, { FC } from 'react';

import { Grid, PageSection } from '@patternfly/react-core';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { RouteKind } from '@utils/types';
import DetailsSectionLeftColumn from '@views/routes/details/components/tabs/detailsTab/components/RouteDetailsSection/DetailsSectionLeftColumn';
import DetailsSectionRightColumn from '@views/routes/details/components/tabs/detailsTab/components/RouteDetailsSection/DetailsSectionRightColumn';

type RouteDetailsSectionProps = {
  route: RouteKind;
};

const RouteDetailsSection: FC<RouteDetailsSectionProps> = ({ route }) => {
  const { t } = useNetworkingTranslation();

  return (
    <PageSection>
      <DetailsSectionTitle titleText={t('Route details')} />
      <Grid hasGutter>
        <DetailsSectionLeftColumn route={route} />
        <DetailsSectionRightColumn route={route} />
      </Grid>
    </PageSection>
  );
};

export default RouteDetailsSection;
