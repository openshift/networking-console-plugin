import React, { createContext, FC, PropsWithChildren, useContext } from 'react';

import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';

type TopologyContextType = {
  resources: NetworkTopologyResources | undefined;
  resourcesLoaded: boolean;
};

const TopologyContext = createContext<TopologyContextType>({
  resources: undefined,
  resourcesLoaded: false,
});

export const TopologyContextProvider: FC<PropsWithChildren<TopologyContextType>> = ({
  children,
  resources,
  resourcesLoaded,
}) => (
  <TopologyContext.Provider value={{ resources, resourcesLoaded }}>
    {children}
  </TopologyContext.Provider>
);

export const useTopologyContext = (): TopologyContextType => {
  const contextData = useContext(TopologyContext);
  return contextData;
};
