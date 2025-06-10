import React, { FC } from 'react';

import { modelToRef, RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { RouteKind } from '@utils/types';
import RouteActions from '@views/routes/actions/RouteActions';

type RouteDetailsPageTitleProps = {
  route: RouteKind;
};

const RouteDetailsPageTitle: FC<RouteDetailsPageTitleProps> = ({ route }) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('Routes'), to: `/k8s/${namespacePath}/${modelToRef(RouteModel)}` },
        { name: t('Route details') },
      ]}
    >
      <Title headingLevel="h1">
        <span
          className="co-m-resource-icon co-m-resource-route co-m-resource-icon--lg"
          title="Route"
        >
          {RouteModel.abbr}
        </span>
        {getName(route)}
      </Title>
      <RouteActions route={route} />
    </DetailsPageTitle>
  );
};

export default RouteDetailsPageTitle;
