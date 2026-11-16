import React, { FC } from 'react';

import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import NADsActions from '@views/nads/actions/NADActions';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { ResourceType } from '@views/topology/utils/constants';
import UDNActions from '@views/udns/actions/UDNActions';

import DefaultTopologyDrawerActions from './DefaultTopologyDrawerActions';

const TopologyDrawerActions: FC = () => {
  const { selectedNode } = useTopologyContext();

  if (!selectedNode) return null;

  switch (selectedNode.resourceType) {
    case ResourceType.NetworkAttachmentDefinition:
      return (
        <NADsActions
          isKebabToggle={false}
          obj={selectedNode.resource as NetworkAttachmentDefinitionKind}
        />
      );
    case ResourceType.UserDefinedNetwork:
    case ResourceType.ClusterUserDefinedNetwork:
      return (
        <UDNActions
          isKebabToggle={false}
          obj={selectedNode.resource as ClusterUserDefinedNetworkKind | UserDefinedNetworkKind}
        />
      );
    default:
      return <DefaultTopologyDrawerActions resource={selectedNode.resource} />;
  }
};

export default TopologyDrawerActions;
