import React, { createContext, FC, PropsWithChildren, useContext } from 'react';

import { ALL_NAMESPACES_KEY } from '@utils/constants';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';
import { NodeNetworkStateKind } from '@views/topology/types';

type TopologyContextType = {
  activeNamespace: string;
  nodeNetworkStates: NodeNetworkStateKind[];
  nodeNetworkStatesLoaded: boolean;
  resources: NetworkTopologyResources | undefined;
  resourcesLoaded: boolean;
};

const TopologyContext = createContext<TopologyContextType>({
  activeNamespace: ALL_NAMESPACES_KEY,
  nodeNetworkStates: [],
  nodeNetworkStatesLoaded: false,
  resources: undefined,
  resourcesLoaded: false,
});

export const TopologyContextProvider: FC<PropsWithChildren<TopologyContextType>> = ({
  activeNamespace,
  children,
  nodeNetworkStates,
  nodeNetworkStatesLoaded,
  resources,
  resourcesLoaded,
}) => (
  <TopologyContext.Provider
    value={{
      activeNamespace,
      nodeNetworkStates,
      nodeNetworkStatesLoaded,
      resources,
      resourcesLoaded,
    }}
  >
    {children}
  </TopologyContext.Provider>
);

export const useTopologyContext = (): TopologyContextType => {
  const contextData = useContext(TopologyContext);
  return contextData;
};
