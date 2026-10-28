import React, { createContext, FC, PropsWithChildren, useContext } from 'react';

import { ALL_NAMESPACES_KEY } from '@utils/constants';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';

type TopologyContextType = {
  activeNamespace: string;
  resources: NetworkTopologyResources | undefined;
  resourcesLoaded: boolean;
};

const TopologyContext = createContext<TopologyContextType>({
  activeNamespace: ALL_NAMESPACES_KEY,
  resources: undefined,
  resourcesLoaded: false,
});

export const TopologyContextProvider: FC<PropsWithChildren<TopologyContextType>> = ({
  activeNamespace,
  children,
  resources,
  resourcesLoaded,
}) => (
  <TopologyContext.Provider value={{ activeNamespace, resources, resourcesLoaded }}>
    {children}
  </TopologyContext.Provider>
);

export const useTopologyContext = (): TopologyContextType => {
  const contextData = useContext(TopologyContext);
  return contextData;
};
