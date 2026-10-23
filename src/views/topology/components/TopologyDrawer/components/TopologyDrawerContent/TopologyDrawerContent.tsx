import React, { FC } from 'react';

import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
} from '@patternfly/react-core';
import TopologyDrawerContentBody from '@views/topology/components/TopologyDrawer/components/TopologyDrawerContent/TopologyDrawerContentBody';
import TopologyDrawerContentHeader from '@views/topology/components/TopologyDrawer/components/TopologyDrawerContent/TopologyDrawerContentHeader';
import { useTopologyContext } from '@views/topology/context/TopologyContext';

import './TopologyDrawerContent.scss';

const TopologyDrawerContent: FC = () => {
  const { onSelectNode, selectedNode } = useTopologyContext();

  if (!selectedNode) return null;

  const handleClose = () => onSelectNode(null);

  return (
    <DrawerPanelContent isResizable minSize="400px">
      <DrawerHead>
        <TopologyDrawerContentHeader />
        <DrawerActions>
          <DrawerCloseButton onClick={handleClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody className="topology-drawer__body">
        <TopologyDrawerContentBody />
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default TopologyDrawerContent;
