import React, { FC } from 'react';

import TopologyDrawerContentPanel from '@views/topology/components/TopologyDrawer/components/TopologyDrawerContent/components/TopologyDrawerContentPanel';
import { useTopologyContext } from '@views/topology/context/TopologyContext';

const TopologyDrawerContent: FC = () => {
  const { onSelectNode, selectedNode } = useTopologyContext();

  if (!selectedNode) return null;

  return (
    <TopologyDrawerContentPanel
      onClose={() => onSelectNode(null)}
      resource={selectedNode.resource}
    />
  );
};

export default TopologyDrawerContent;
