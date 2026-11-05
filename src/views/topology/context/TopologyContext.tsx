import React, { createContext, FC, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { Node } from '@patternfly/react-topology';
import { ALL_NAMESPACES_KEY } from '@utils/constants';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';
import { NodeNetworkStateKind } from '@views/topology/types';
import { ResourceType } from '@views/topology/utils/constants';

export type SelectedNodeData = {
  resource: K8sResourceCommon;
  resourceType: ResourceType;
};

type TopologyContextType = {
  activeNamespace: string;
  nodeNetworkStates: NodeNetworkStateKind[];
  nodeNetworkStatesLoaded: boolean;
  onSelectNode: (node: Node | null) => void;
  resources: NetworkTopologyResources | undefined;
  resourcesLoaded: boolean;
  selectedNode: null | SelectedNodeData;
};

const TopologyContext = createContext<TopologyContextType>({
  activeNamespace: ALL_NAMESPACES_KEY,
  nodeNetworkStates: [],
  nodeNetworkStatesLoaded: false,
  onSelectNode: () => {},
  resources: undefined,
  resourcesLoaded: false,
  selectedNode: null,
});

type TopologyContextProviderProps = {
  activeNamespace: string;
  nodeNetworkStates: NodeNetworkStateKind[];
  nodeNetworkStatesLoaded: boolean;
  resources: NetworkTopologyResources | undefined;
  resourcesLoaded: boolean;
};

export const TopologyContextProvider: FC<PropsWithChildren<TopologyContextProviderProps>> = ({
  activeNamespace,
  children,
  nodeNetworkStates,
  nodeNetworkStatesLoaded,
  resources,
  resourcesLoaded,
}) => {
  const [selectedNode, setSelectedNode] = useState<null | SelectedNodeData>(null);

  const onSelectNode = (node: Node | null) => {
    if (!node) {
      setSelectedNode(null);
      return;
    }

    const data = node.getData();
    if (data?.resource && data?.resourceType) {
      setSelectedNode({
        resource: data.resource,
        resourceType: data.resourceType,
      });
    }
  };

  const value = useMemo(
    () => ({
      activeNamespace,
      nodeNetworkStates,
      nodeNetworkStatesLoaded,
      onSelectNode,
      resources,
      resourcesLoaded,
      selectedNode,
    }),
    [
      activeNamespace,
      resources,
      resourcesLoaded,
      selectedNode,
      nodeNetworkStates,
      nodeNetworkStatesLoaded,
    ],
  );

  return <TopologyContext.Provider value={value}>{children}</TopologyContext.Provider>;
};

export const useTopologyContext = (): TopologyContextType => {
  const contextData = useContext(TopologyContext);
  return contextData;
};
