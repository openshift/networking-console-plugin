import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRoutingModel } from '@utils/models';
import { BGPRouting } from '@utils/resources/bgp/types';

import { shouldHideBGPResourceTabs } from '../utils/olm';

import BGPRoutingDetailsTab from './components/BGPRoutingDetailsTab';
import BGPRoutingPageTitle from './components/BGPRoutingPageTitle';
import BGPRoutingYAML from './components/BGPRoutingYAML';

const BGPRoutingDetailsPage: FC<{ name: string }> = ({ name }) => {
  const { t } = useNetworkingTranslation();
  const [obj, loaded, error] = useK8sWatchResource<BGPRouting>({
    groupVersionKind: modelToGroupVersionKind(BGPRoutingModel),
    name,
  });
  const pages = [
    { component: BGPRoutingDetailsTab, href: '', name: t('Details') },
    { component: BGPRoutingYAML, href: 'yaml', name: t('YAML') },
  ];

  return (
    <StatusBox error={error} loaded={loaded}>
      <BGPRoutingPageTitle obj={obj} />
      {!shouldHideBGPResourceTabs() && <HorizontalNav pages={pages} resource={obj} />}
    </StatusBox>
  );
};

export default BGPRoutingDetailsPage;
