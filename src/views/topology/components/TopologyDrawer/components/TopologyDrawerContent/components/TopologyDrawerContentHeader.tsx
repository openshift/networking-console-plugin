import React, { FC } from 'react';

import {
  getGroupVersionKindForResource,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { Title } from '@patternfly/react-core';
import { getName, getNamespace } from '@utils/resources/shared';
import { useTopologyContext } from '@views/topology/context/TopologyContext';

const TopologyDrawerContentHeader: FC = () => {
  const { selectedNode } = useTopologyContext();

  const { resource } = selectedNode;

  return (
    <Title headingLevel="h2" size="xl">
      <ResourceLink
        groupVersionKind={getGroupVersionKindForResource(resource)}
        name={getName(resource)}
        namespace={getNamespace(resource)}
      />
    </Title>
  );
};

export default TopologyDrawerContentHeader;
