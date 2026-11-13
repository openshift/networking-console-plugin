import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel } from '@utils/models';
import { BGPCloudConfiguration } from '@utils/resources/bgp/types';

import { shouldHideBGPResourceTabs } from '../utils/olm';

import BGPCloudConfigurationDetailsTab from './components/BGPCloudConfigurationDetailsTab';
import BGPCloudConfigurationPageTitle from './components/BGPCloudConfigurationPageTitle';
import BGPCloudConfigurationYAML from './components/BGPCloudConfigurationYAML';
import FRRConfigurationsTab from './components/FRRConfigurationsTab';

const BGPCloudConfigurationDetailsPage: FC<{ name: string }> = ({ name }) => {
  const { t } = useNetworkingTranslation();
  const [obj, loaded, error] = useK8sWatchResource<BGPCloudConfiguration>({
    groupVersionKind: modelToGroupVersionKind(BGPCloudConfigurationModel),
    name,
  });
  const pages = [
    { component: BGPCloudConfigurationDetailsTab, href: '', name: t('Details') },
    { component: FRRConfigurationsTab, href: 'frrconfigurations', name: t('FRRConfigurations') },
    { component: BGPCloudConfigurationYAML, href: 'yaml', name: t('YAML') },
  ];

  return (
    <StatusBox error={error} loaded={loaded}>
      <BGPCloudConfigurationPageTitle obj={obj} />
      {!shouldHideBGPResourceTabs() && <HorizontalNav pages={pages} resource={obj} />}
    </StatusBox>
  );
};

export default BGPCloudConfigurationDetailsPage;
