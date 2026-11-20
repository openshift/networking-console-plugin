import React, { FC, useEffect, useState } from 'react';

import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import {
  DrawerActions,
  DrawerCloseButton,
  DrawerColorVariant,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  DrawerSection,
  Tab,
  Tabs,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getUID } from '@utils/resources/shared';
import DetailsTab from '@views/topology/components/TopologyDrawer/components/TopologyDrawerContent/components/TopologyDrawerTabs/DetailsTab';
import NetworkPathTab from '@views/topology/components/TopologyDrawer/components/TopologyDrawerContent/components/TopologyDrawerTabs/NetworkPathTab';
import ResourcesTab from '@views/topology/components/TopologyDrawer/components/TopologyDrawerContent/components/TopologyDrawerTabs/ResourcesTab';

import TopologyDrawerActions from '../../TopologyDrawerActions/TopologyDrawerActions';

import TopologyDrawerConfigurationAlerts from './TopologyDrawerConfigurationAlerts';
import TopologyDrawerContentHeader from './TopologyDrawerContentHeader';

import './TopologyDrawerContentPanel.scss';

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
    <DrawerPanelContent className="topology-drawer__panel" isResizable minSize="400px">
      <DrawerHead>
        <TopologyDrawerContentHeader />
        <DrawerActions>
          <TopologyDrawerActions />
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <TopologyDrawerConfigurationAlerts />
      <DrawerSection colorVariant={DrawerColorVariant.secondary}>
        <Tabs activeKey={activeTab} onSelect={(_, tabIndex: number) => setActiveTab(tabIndex)}>
          <Tab eventKey={0} title={t('Details')} />
          <Tab eventKey={1} title={t('Network path')} />
          <Tab eventKey={2} title={t('Resources')} />
        </Tabs>
      </DrawerSection>
      <DrawerPanelBody className="topology-drawer__content">
        {activeTab === 0 && <DetailsTab />}
        {activeTab === 1 && <NetworkPathTab />}
        {activeTab === 2 && <ResourcesTab />}
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default TopologyDrawerContentPanel;
