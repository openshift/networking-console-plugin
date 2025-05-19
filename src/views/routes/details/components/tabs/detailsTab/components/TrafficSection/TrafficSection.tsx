import React, { FC } from 'react';

import { PageSection } from '@patternfly/react-core';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { RouteKind } from '@utils/types';
import TrafficSettings from '@views/routes/details/components/tabs/detailsTab/components/TrafficSection/TrafficSettings';

type TrafficSectionProps = {
  route: RouteKind;
};

const TrafficSection: FC<TrafficSectionProps> = ({ route }) => {
  const { t } = useNetworkingTranslation();

  return (
    <PageSection>
      <DetailsSectionTitle titleText={t('Traffic')} />
      <TrafficSettings route={route} />
    </PageSection>
  );
};

export default TrafficSection;
