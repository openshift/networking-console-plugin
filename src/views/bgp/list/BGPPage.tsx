import React, { FC, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  ListPageCreateButton,
  ListPageHeader,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel, BGPRoutingModel } from '@utils/models';
import { BGPCloudConfiguration } from '@utils/resources/bgp';
import { resourcePathFromModel } from '@utils/resources/shared';

import { shouldHideBGPResourceTabs } from '../olm';

import BGPCloudConfigurationList from './BGPCloudConfigurationList';
import BGPRoutingList from './BGPRoutingList';

const BGPPage: FC = () => {
  const { t } = useNetworkingTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [configurations, configurationsLoaded] = useK8sWatchResource<BGPCloudConfiguration[]>({
    groupVersionKind: modelToGroupVersionKind(BGPCloudConfigurationModel),
    isList: true,
  });
  const isRouting = location.pathname.includes('~BGPRouting');
  const hasConfiguration = Boolean(configurationsLoaded && configurations?.length);
  const hideResourceTabs = shouldHideBGPResourceTabs(location.pathname);
  const selectedModel = isRouting ? BGPRoutingModel : BGPCloudConfigurationModel;
  const activeKey = useMemo(() => (isRouting ? 'routing' : 'configuration'), [isRouting]);
  const createPath = `${resourcePathFromModel(selectedModel)}/~new/form`;
  const listContent = isRouting ? <BGPRoutingList /> : <BGPCloudConfigurationList />;

  return (
    <>
      <ListPageHeader title={t('BGP')}>
        {!(activeKey === 'configuration' && hasConfiguration) && (
          <ListPageCreateButton
            createAccessReview={{
              groupVersionKind: modelToGroupVersionKind(selectedModel),
              namespace: null,
            }}
            onClick={() => navigate(createPath)}
          >
            {t('Create {{kind}}', { kind: selectedModel.kind })}
          </ListPageCreateButton>
        )}
      </ListPageHeader>
      {hideResourceTabs ? (
        listContent
      ) : (
        <Tabs
          activeKey={activeKey}
          onSelect={(_, key) => {
            navigate(
              key === 'routing'
                ? resourcePathFromModel(BGPRoutingModel)
                : resourcePathFromModel(BGPCloudConfigurationModel),
            );
          }}
          usePageInsets
        >
          <Tab
            eventKey="configuration"
            title={<TabTitleText>{t('BGPCloudConfiguration')}</TabTitleText>}
          >
            <BGPCloudConfigurationList />
          </Tab>
          <Tab
            eventKey="routing"
            isDisabled={!hasConfiguration}
            title={<TabTitleText>{t('BGPRouting')}</TabTitleText>}
          >
            <BGPRoutingList />
          </Tab>
        </Tabs>
      )}
    </>
  );
};

export default BGPPage;
