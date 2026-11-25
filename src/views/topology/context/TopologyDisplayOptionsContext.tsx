import { createContext, useContext } from 'react';

import { DisplayOptionsState } from '@views/topology/types';
import { DEFAULT_DISPLAY_OPTIONS } from '@views/topology/utils/constants';

const TopologyDisplayOptionsContext = createContext<DisplayOptionsState>(DEFAULT_DISPLAY_OPTIONS);

export const TopologyDisplayOptionsProvider = TopologyDisplayOptionsContext.Provider;

export const useTopologyDisplayOptions = () => useContext(TopologyDisplayOptionsContext);
