import React, { FC } from 'react';

import { modelToRef } from '@kubevirt-ui-ext/kubevirt-api/console';
import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel } from '@utils/models';
import { BGPCloudConfiguration } from '@utils/resources/bgp/types';
import { getName } from '@utils/resources/shared';

import BGPDetailsActions from './BGPDetailsActions';

const BGPCloudConfigurationPageTitle: FC<{ obj?: BGPCloudConfiguration }> = ({ obj }) => {
  const { t } = useNetworkingTranslation();

  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('BGP'), to: `/k8s/cluster/${modelToRef(BGPCloudConfigurationModel)}` },
        { name: t('{{kind}} details', { kind: BGPCloudConfigurationModel.kind }) },
      ]}
    >
      <Title headingLevel="h1">
        <span
          className="co-m-resource-icon co-m-resource-icon--lg"
          title={BGPCloudConfigurationModel.abbr}
        >
          {BGPCloudConfigurationModel.abbr}
        </span>
        {getName(obj)}
      </Title>
      {obj && <BGPDetailsActions model={BGPCloudConfigurationModel} obj={obj} />}
    </DetailsPageTitle>
  );
};

export default BGPCloudConfigurationPageTitle;
