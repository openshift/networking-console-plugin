import { useMemo } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { WORKER_NODE_LABEL } from '@utils/resources/nmstate/constants';

import {
  attachConsumers,
  getConsumersByNAD,
  getNADPhysicalNetworks,
  getObservedMappings,
  getPolicyPhysicalNetworks,
  mergePhysicalNetworks,
} from '../utils/aggregation';
import { getLocalnetNADs } from '../utils/localnet';
import { getConsumersAvailability, isReadable } from '../utils/sourceStates';
import {
  ConsumersAvailability,
  PhysicalNetwork,
  PhysicalNetworksSources,
  SourceAvailability,
} from '../utils/types';

import usePhysicalNetworkSources from './usePhysicalNetworkSources';

type UsePhysicalNetworks = (scope: string | undefined) => {
  consumersAvailability: ConsumersAvailability;
  networks: PhysicalNetwork[];
  sources: PhysicalNetworksSources;
};

const usePhysicalNetworks: UsePhysicalNetworks = (scope) => {
  const { t } = useNetworkingTranslation();
  const sources = usePhysicalNetworkSources(scope);
  const kubevirtEnabled = sources.virtualMachines.availability !== SourceAvailability.Absent;

  const networks = useMemo(() => {
    const workerNodes = sources.nodes.data.filter(
      (node) => node?.metadata?.labels?.[WORKER_NODE_LABEL] === '',
    );

    const observedMappings = getObservedMappings(
      sources.nodeNetworkStates.data,
      sources.nodes.data,
    );
    const mappingRows: PhysicalNetwork[] = Object.entries(observedMappings).map(
      ([name, mappings]) => ({
        consumersByNAD: {},
        nads: [],
        name,
        nncpDetails: [],
        observedMappings: mappings,
        selectedNodes: [],
      }),
    );

    const consumersByNAD =
      isReadable(sources.pods) || isReadable(sources.virtualMachines)
        ? getConsumersByNAD(sources.pods.data, sources.virtualMachines.data)
        : {};

    return attachConsumers(
      mergePhysicalNetworks(
        getNADPhysicalNetworks(getLocalnetNADs(sources.nads.data)),
        getPolicyPhysicalNetworks(sources.nncps.data, workerNodes, sources.nnces.data, t),
        mappingRows,
      ),
      consumersByNAD,
    );
  }, [sources, t]);

  return {
    consumersAvailability: getConsumersAvailability(
      sources.pods,
      sources.virtualMachines,
      kubevirtEnabled,
    ),
    networks,
    sources,
  };
};

export default usePhysicalNetworks;
