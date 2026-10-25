import React, { FC, ReactNode } from 'react';

import { Drawer, DrawerContent, DrawerContentBody } from '@patternfly/react-core';
import TopologyDrawerContent from '@views/topology/components/TopologyDrawer/components/TopologyDrawerContent/TopologyDrawerContent';
import { useTopologyContext } from '@views/topology/context/TopologyContext';

type TopologyDrawerProps = { children: ReactNode };

const TopologyDrawer: FC<TopologyDrawerProps> = ({ children }) => {
  const { selectedNode } = useTopologyContext();

  return (
    <Drawer isExpanded={!!selectedNode} isInline position="right">
      <DrawerContent panelContent={<TopologyDrawerContent />}>
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default TopologyDrawer;
