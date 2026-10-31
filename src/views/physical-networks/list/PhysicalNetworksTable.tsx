import React, { Dispatch, FC, SetStateAction, useMemo, useState } from 'react';

import { Pagination } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import usePagination from '@utils/hooks/usePagination/usePagination';
import { paginationDefaultValues } from '@utils/hooks/usePagination/utils/constants';

import usePhysicalNetworkColumns, { PhysicalNetworkColumnIDs } from '../hooks/usePhysicalNetworkColumns';
import { NetworksSearchType } from '../utils/constants';
import {
  ConfigurationDetails,
  ConsumersAvailability,
  LocalnetNAD,
  PhysicalNetwork,
  PhysicalNetworksSources,
} from '../utils/types';

import PhysicalNetworkRow from './PhysicalNetworkRow';
import SearchBar from './SearchBar';
import { filterPhysicalNetworks } from './utils';

import './physical-networks-table.scss';

type PhysicalNetworksTableProps = {
  actionsEnabled: { configure: boolean; createVMNetwork: boolean };
  consumersAvailability: ConsumersAvailability;
  networks: PhysicalNetwork[];
  onShowConsumers: (nad: LocalnetNAD, networkName: string) => void;
  setSelectedConfiguration: Dispatch<SetStateAction<ConfigurationDetails>>;
  sources: PhysicalNetworksSources;
};

const PhysicalNetworksTable: FC<PhysicalNetworksTableProps> = ({
  actionsEnabled,
  consumersAvailability,
  networks,
  onShowConsumers,
  setSelectedConfiguration,
  sources,
}) => {
  const { t } = useNetworkingTranslation();
  const [searchType, setSearchType] = useState<NetworksSearchType>(NetworksSearchType.Name);
  const [searchInput, setSearchInput] = useState('');
  const [expandedNetworkNames, setExpandedNetworkNames] = useState<string[]>([]);

  const { onPaginationChange, pagination } = usePagination();

  const filteredNetworks = useMemo(
    () => filterPhysicalNetworks(networks, searchType, searchInput),
    [networks, searchInput, searchType],
  );

  const { columns, getSortType, sortedData } = usePhysicalNetworkColumns(
    filteredNetworks,
    pagination,
  );

  const onToggleExpansion = (network: PhysicalNetwork) =>
    setExpandedNetworkNames((previousExpanded) =>
      previousExpanded.includes(network.name)
        ? previousExpanded.filter((name) => name !== network.name)
        : [...previousExpanded, network.name],
    );

  return (
    <div className="physical-networks-table">
      <div className="physical-networks-table__toolbar">
        <SearchBar
          onSearchInputChange={setSearchInput}
          onSearchTypeChange={setSearchType}
          searchInput={searchInput}
          searchType={searchType}
        />
        <Pagination
          className="list-managment-group__pagination"
          isCompact
          itemCount={filteredNetworks.length}
          onPerPageSelect={(_event, perPage, page, startIndex, endIndex) =>
            onPaginationChange({ endIndex, page, perPage, startIndex })
          }
          onSetPage={(_event, page, perPage, startIndex, endIndex) =>
            onPaginationChange({ endIndex, page, perPage, startIndex })
          }
          page={pagination.page}
          perPage={pagination.perPage}
          perPageOptions={paginationDefaultValues}
        />
      </div>
      <Table aria-label={t('Physical networks table')} isExpandable>
        <Thead>
          <Tr>
            <Th screenReaderText={t('Row expansion')} />
            {columns.map(({ id, title }) => (
              <Th key={id} sort={id === PhysicalNetworkColumnIDs.Name ? getSortType(1) : undefined}>
                {title}
              </Th>
            ))}
          </Tr>
        </Thead>
        {sortedData.map((network, rowIndex) => (
          <PhysicalNetworkRow
            actionsEnabled={actionsEnabled}
            consumersAvailability={consumersAvailability}
            index={rowIndex}
            isExpanded={expandedNetworkNames.includes(network.name)}
            key={network.name}
            network={network}
            onShowConsumers={onShowConsumers}
            onToggleExpansion={onToggleExpansion}
            setSelectedConfiguration={setSelectedConfiguration}
            sources={sources}
          />
        ))}
        {sortedData.length === 0 && (
          <Tbody>
            <Tr>
              <Td colSpan={columns.length + 1}>{t('No physical networks match the search.')}</Td>
            </Tr>
          </Tbody>
        )}
      </Table>
    </div>
  );
};

export default PhysicalNetworksTable;
