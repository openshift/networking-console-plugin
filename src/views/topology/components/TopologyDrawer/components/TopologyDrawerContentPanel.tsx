import React, { FC, useEffect, useState } from 'react';

import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Tab,
  Tabs,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getUID } from '@utils/resources/shared';
import DetailsTab from '@views/topology/components/TopologyDrawer/components/TopologyDrawerTabs/DetailsTab';
import NetworkPathTab from '@views/topology/components/TopologyDrawer/components/TopologyDrawerTabs/NetworkPathTab';
import ResourcesTab from '@views/topology/components/TopologyDrawer/components/TopologyDrawerTabs/ResourcesTab';

import TopologyDrawerActions from './TopologyDrawerActions';
import TopologyDrawerContentHeader from './TopologyDrawerContentHeader';

type TopologyDrawerContentPanelProps = {
  onClose: () => void;
  resource: K8sResourceCommon;
};

const TopologyDrawerContentPanel: FC<TopologyDrawerContentPanelProps> = ({ onClose, resource }) => {
  const { t } = useNetworkingTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const resourceUID = getUID(resource);

  useEffect(() => setActiveTab(0), [resourceUID]);

  return (
    <DrawerPanelContent isResizable minSize="400px">
      <DrawerHead>
        <TopologyDrawerContentHeader />
        <DrawerActions>
          <TopologyDrawerActions />
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <Tabs activeKey={activeTab} onSelect={(_, tabIndex: number) => setActiveTab(tabIndex)}>
          <Tab eventKey={0} title={t('Details')}>
            <DetailsTab />
          </Tab>
          <Tab eventKey={1} title={t('Network path')}>
            <NetworkPathTab />
          </Tab>
          <Tab eventKey={2} title={t('Resources')}>
            <ResourcesTab />
          </Tab>
        </Tabs>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default TopologyDrawerContentPanel;
