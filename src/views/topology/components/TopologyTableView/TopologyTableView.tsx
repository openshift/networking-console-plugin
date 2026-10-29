import React, { FC, useMemo, useState } from 'react';

import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  MenuToggle,
  Pagination,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { NodeNetworkStateKind } from '@views/topology/types';

import NodeInterfacesTable from './NodeInterfacesTable';
import { DEFAULT_PER_PAGE, paginate } from './utils';

const TopologyTableView: FC = () => {
  const { t } = useNetworkingTranslation();
  const { nodeNetworkStates, nodeNetworkStatesLoaded } = useTopologyContext();

  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const filteredNodes: NodeNetworkStateKind[] = useMemo(() => {
    if (!nameFilter.trim()) return nodeNetworkStates;
    const query = nameFilter.toLowerCase();
    return nodeNetworkStates.filter((nns) => (getName(nns) ?? '').toLowerCase().includes(query));
  }, [nodeNetworkStates, nameFilter]);

  const paginatedNodes = useMemo(
    () => paginate(filteredNodes, page, perPage),
    [filteredNodes, page, perPage],
  );

  const toggleExpand = (nodeName: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeName)) {
        next.delete(nodeName);
      } else {
        next.add(nodeName);
      }
      return next;
    });
  };

  if (!nodeNetworkStatesLoaded) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  return (
    <>
      <Toolbar className="pf-v6-u-pt-md" colorVariant="no-background">
        <ToolbarContent>
          <ToolbarItem>
            <MenuToggle icon={<FilterIcon />} isDisabled variant="plainText">
              {t('Name')}
            </MenuToggle>
          </ToolbarItem>
          <ToolbarItem>
            <SearchInput
              aria-label={t('Search by name...')}
              onChange={(_event, value) => {
                setNameFilter(value);
                setPage(1);
              }}
              onClear={() => {
                setNameFilter('');
                setPage(1);
              }}
              placeholder={t('Search by name...')}
              value={nameFilter}
            />
          </ToolbarItem>
          <ToolbarItem align={{ default: 'alignEnd' }}>
            <Pagination
              isCompact
              itemCount={filteredNodes.length}
              onPerPageSelect={(_event, newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
              onSetPage={(_event, newPage) => setPage(newPage)}
              page={page}
              perPage={perPage}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filteredNodes.length === 0 ? (
        <EmptyState>
          <EmptyStateBody>
            {nameFilter
              ? t('No nodes match the current filter.')
              : t('No node network states found.')}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label={t('Node network states')} variant="compact">
          <Thead>
            <Tr>
              <Td />
              <Th>{t('Name')}</Th>
              <Th>{t('Network interface')}</Th>
              <Td />
            </Tr>
          </Thead>
          {paginatedNodes.map((nns) => {
            const nodeName = getName(nns) ?? '';
            const interfaces = nns.status?.currentState?.interfaces ?? [];
            const isExpanded = expandedNodes.has(nodeName);

            return (
              <Tbody isExpanded={isExpanded} key={nodeName}>
                <Tr>
                  <Td
                    expand={{
                      isExpanded,
                      onToggle: () => toggleExpand(nodeName),
                      rowIndex: 0,
                    }}
                  />
                  <Td dataLabel={t('Name')}>{nodeName}</Td>
                  <Td dataLabel={t('Network interface')}>
                    {t('Network details {{count}} interfaces', { count: interfaces.length })}
                  </Td>
                  <Td isActionCell />
                </Tr>
                {isExpanded && (
                  <Tr isExpanded>
                    <Td colSpan={4}>
                      <NodeInterfacesTable interfaces={interfaces} />
                    </Td>
                  </Tr>
                )}
              </Tbody>
            );
          })}
        </Table>
      )}
    </>
  );
};

export default TopologyTableView;
