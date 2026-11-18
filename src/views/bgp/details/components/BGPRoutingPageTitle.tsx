import React, { FC } from 'react';

import { modelToRef } from '@kubevirt-ui-ext/kubevirt-api/console';
import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRoutingModel } from '@utils/models';
import { BGPRouting } from '@utils/resources/bgp/types';
import { getName } from '@utils/resources/shared';

import BGPDetailsActions from './BGPDetailsActions';

const BGPRoutingPageTitle: FC<{ obj?: BGPRouting }> = ({ obj }) => {
  const { t } = useNetworkingTranslation();

  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('BGP'), to: `/k8s/cluster/${modelToRef(BGPRoutingModel)}` },
        { name: t('{{kind}} details', { kind: BGPRoutingModel.kind }) },
      ]}
    >
      <Title headingLevel="h1">
        <span className="co-m-resource-icon co-m-resource-icon--lg" title={BGPRoutingModel.abbr}>
          {BGPRoutingModel.abbr}
        </span>
        {getName(obj)}
      </Title>
      {obj && <BGPDetailsActions model={BGPRoutingModel} obj={obj} />}
    </DetailsPageTitle>
  );
};

export default BGPRoutingPageTitle;
