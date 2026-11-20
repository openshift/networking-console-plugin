import React, { FC } from 'react';

import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { ResourceType } from '@views/topology/utils/constants';

import NetworkResourcesTab from './NetworkResourcesTab';
import WorkloadResourcesTab from './WorkloadResourcesTab';

const ResourcesTab: FC = () => {
  const { selectedNode } = useTopologyContext();

  if (!selectedNode) return null;

  switch (selectedNode.resourceType) {
    case ResourceType.NetworkAttachmentDefinition:
    case ResourceType.UserDefinedNetwork:
    case ResourceType.ClusterUserDefinedNetwork:
      return <NetworkResourcesTab />;
    case ResourceType.Pod:
    case ResourceType.VirtualMachine:
      return <WorkloadResourcesTab />;
    default:
      return null;
  }
};

export default ResourcesTab;
