import React, { FC, useMemo, useState } from 'react';

import {
  MenuToggle,
  Pagination,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NMStateInterface } from '@views/topology/types';

import {
  DEFAULT_PER_PAGE,
  formatInterfaceLinks,
  formatIPAddresses,
  groupInterfacesByType,
  interfaceTypeLabel,
  paginate,
} from './utils';

import './TopologyTableView.scss';

type NodeInterfacesTableProps = {
  interfaces: NMStateInterface[];
};

const NodeInterfacesTable: FC<NodeInterfacesTableProps> = ({ interfaces }) => {
  const { t } = useNetworkingTranslation();
  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const filteredInterfaces = useMemo(() => {
    if (!nameFilter.trim()) return interfaces;
    const query = nameFilter.toLowerCase();
    return interfaces.filter((iface) => iface.name.toLowerCase().includes(query));
  }, [interfaces, nameFilter]);

  const paginatedInterfaces = useMemo(
    () => paginate(filteredInterfaces, page, perPage),
    [filteredInterfaces, page, perPage],
  );

  const groups = useMemo(() => groupInterfacesByType(paginatedInterfaces), [paginatedInterfaces]);

  return (
    <div className="topology-table-view__inner-table">
      <Toolbar className="pf-v6-u-pt-md" colorVariant="no-background">
        <ToolbarContent>
          <ToolbarItem>
            <MenuToggle icon={<FilterIcon />} isDisabled variant="plainText">
              {t('Name')}
            </MenuToggle>
          </ToolbarItem>
          <ToolbarItem>
            <SearchInput
              aria-label={t('Filter by name...')}
              onChange={(_event, value) => {
                setNameFilter(value);
                setPage(1);
              }}
              onClear={() => {
                setNameFilter('');
                setPage(1);
              }}
              placeholder={t('Filter by name...')}
              value={nameFilter}
            />
          </ToolbarItem>
          <ToolbarItem align={{ default: 'alignEnd' }}>
            <Pagination
              isCompact
              itemCount={filteredInterfaces.length}
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
      <Table borders variant="compact">
        <Thead>
          <Tr>
            <Th>{t('Name')}</Th>
            <Th>{t('Links')}</Th>
            <Th>{t('IP address')}</Th>
            <Th>{t('Ports')}</Th>
            <Th>{t('MAC address')}</Th>
            <Th>{t('LLDP')}</Th>
            <Th>{t('MTU')}</Th>
            <Td />
          </Tr>
        </Thead>
        {groups.map((group) => (
          <Tbody key={group.type}>
            <Tr>
              <Td colSpan={8}>
                <strong>
                  {interfaceTypeLabel(t, group.type)} ({group.interfaces.length})
                </strong>
              </Td>
            </Tr>
            {group.interfaces.map((iface) => {
              const links = formatInterfaceLinks(iface);
              const ip = formatIPAddresses(iface);
              const ports = iface.bridge?.port?.length;
              const mac = iface['mac-address'];

              return (
                <Tr key={iface.name}>
                  <Td dataLabel={t('Name')}>{iface.name}</Td>
                  <Td dataLabel={t('Links')}>
                    {links.length > 0 ? (
                      links.map((link, i) => <div key={i}>{link}</div>)
                    ) : (
                      <MutedText content="–" />
                    )}
                  </Td>
                  <Td dataLabel={t('IP address')}>{ip || <MutedText content="–" />}</Td>
                  <Td dataLabel={t('Ports')}>
                    {ports !== undefined ? ports : <MutedText content="–" />}
                  </Td>
                  <Td dataLabel={t('MAC address')}>{mac || <MutedText content="–" />}</Td>
                  <Td dataLabel={t('LLDP')}>
                    <MutedText content="–" />
                  </Td>
                  <Td dataLabel={t('MTU')}>{iface.mtu ?? <MutedText content="–" />}</Td>
                  <Td isActionCell />
                </Tr>
              );
            })}
          </Tbody>
        ))}
      </Table>
    </div>
  );
};

export default NodeInterfacesTable;
