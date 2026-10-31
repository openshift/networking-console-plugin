import { TFunction } from 'i18next';

import { NO_DATA_DASH } from '@utils/utils/constants';

import { NetworksSearchType } from '../utils/constants';
import { PhysicalNetwork, SourceAvailability } from '../utils/types';

const matchesSearchInput = (value: string, searchInput: string): boolean =>
  value?.includes(searchInput) ?? false;

export const filterPhysicalNetworks = (
  networks: PhysicalNetwork[],
  searchType: NetworksSearchType,
  searchInput: string,
): PhysicalNetwork[] => {
  if (!searchInput) return networks;

  switch (searchType) {
    case NetworksSearchType.Name:
      return networks.filter(({ name }) => matchesSearchInput(name, searchInput));
    case NetworksSearchType.Nodes:
      return networks.filter(
        (network) =>
          network.selectedNodes.some((node) =>
            matchesSearchInput(node?.metadata?.name, searchInput),
          ) ||
          network.observedMappings.some(({ nodeName }) =>
            matchesSearchInput(nodeName, searchInput),
          ),
      );
    case NetworksSearchType.Configurations:
      return networks.filter((network) =>
        network.nncpDetails.some(({ configurationName }) =>
          matchesSearchInput(configurationName, searchInput),
        ),
      );
    default:
      return networks;
  }
};

export const getSourceBackedValue = (
  availability: SourceAvailability,
  count: number,
  t: TFunction,
  emptyValue: string,
): string => {
  switch (availability) {
    case SourceAvailability.Available:
      return count > 0 ? String(count) : emptyValue;
    case SourceAvailability.Forbidden:
    case SourceAvailability.Error:
      return t('Unavailable');
    default:
      return NO_DATA_DASH;
  }
};
